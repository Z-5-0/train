import { inject, Injectable } from "@angular/core";
import { RouteService } from './route.service';
import { AppSettingsService } from './app-settings.service';
import { DateTime, Duration } from 'luxon';
import { TRANSPORT_MODE } from '../shared/constants/transport-mode';
import { RestApiService } from "./rest-api.service";
import { catchError, interval, map, Observable, of, startWith, switchMap, throwError } from "rxjs";
import { DelayStatus, TransportMode } from "../shared/models/common";
import polyline from '@mapbox/polyline';
import { MessageService } from "./message.service";
import { RouteSequence } from "../shared/models/route";
import { createTripPathQuery } from "../shared/constants/query/trip-path-query";
import { RealtimeStopTime, RealtimeTripData, RealtimeTripResponse, RealtimeVehiclePosition } from "../shared/models/api/response-realtime";
import { ExtendedVehiclePosition, RealtimeTripPath, RealtimeTripPathOriginData } from "../shared/models/realtime-trip-path";


@Injectable({
    providedIn: 'root',
})
export class RealtimeService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);
    private messageService: MessageService = inject(MessageService);

    startRealtimeDataPolling() {
        return this.appSettingsService.appSettings$.pipe(
            map(settings => settings['updateTime']),
            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getRealtimeData())
                )
            )
        );
    }

    getRealtimeData(): Observable<RealtimeTripPath | null> {
        const ids = this.routeService.getSelectedTripIds();

        if (!ids.length) {
            return of(null);
        }

        return this.restApi.getTrip({
            body: {
                query: createTripPathQuery(ids),
                variables: {}
            },
            debounceTime: false
        }).pipe(
            map((resp: RealtimeTripResponse) => this.createRealtimeData(resp)),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    createRealtimeData(resp: RealtimeTripResponse): RealtimeTripPath {
        if (!resp?.data) return null;

        const trips = Object.values(resp.data);
        const allStops = trips.map((trip: RealtimeTripData) => trip.stoptimes);

        const extendedVehicleData = Object.values(resp.data)
            .flatMap((trip: RealtimeTripData) => trip.vehiclePositions.map((v: RealtimeVehiclePosition) => ({
                ...v,
                tripGeometry: trip.tripGeometry,
                stoptimes: trip.stoptimes
            })));

        const originData = this.createOriginStopData(allStops);
        const transportData = this.createTransportData(extendedVehicleData);

        return { originData, transportData };
    }

    createOriginStopData(stops: RealtimeStopTime[][]): RealtimeTripPathOriginData[] {
        const route = this.routeService.getSelectedRoute();

        const transportRouteOrigins = route?.sequences
            .filter((seq: RouteSequence) => seq.mode !== 'WALK')
            .map((seq: RouteSequence) => {
                return {
                    gtfsId: seq.origin.gtfsId,
                    name: seq.transportInfo![TRANSPORT_MODE[seq.mode as TransportMode].name] ?? null,
                    mode: seq.mode,
                    modeData: TRANSPORT_MODE[seq.mode as TransportMode],
                }
            })
            || [];

        const walkRouteOrigins = route?.sequences
            .filter((seq: RouteSequence) => seq.mode === 'WALK')
            .map((seq: RouteSequence) => {
                return {
                    gtfsId: seq.origin.gtfsId,
                    origin: seq.origin.name,
                    name: seq.transportInfo![TRANSPORT_MODE[seq.mode as TransportMode].name] ?? null,
                    mode: seq.mode,
                    modeData: TRANSPORT_MODE[seq.mode as TransportMode],
                    geometry: seq.origin.geometry
                }
            })
            || [];

        const transportOriginStops = stops.flatMap((stop: RealtimeStopTime[], index: number) => {
            return stop
                .filter((stop: RealtimeStopTime) => transportRouteOrigins[index].gtfsId === stop.stop.gtfsId)
                .map((stop: RealtimeStopTime) => {
                    return {
                        label: stop.stop.name,
                        transportName: transportRouteOrigins[index].name || null,
                        mode: transportRouteOrigins[index].mode,
                        modeData: transportRouteOrigins[index].modeData,
                        scheduledStartTime: DateTime.fromSeconds(stop.serviceDay + stop.scheduledDeparture)
                            .setZone('Europe/Budapest')
                            .toFormat('HH:mm'),
                        delayedStartTime: DateTime.fromSeconds(
                            stop.realtime
                                ? stop.serviceDay + stop.realtimeDeparture
                                : stop.serviceDay + stop.scheduledDeparture + stop.departureDelay
                        )
                            .setZone('Europe/Budapest')
                            .toFormat('HH:mm'),
                        departureDelay: (stop.departureDelay > 0)
                            ? Math.floor(Math.abs(Duration.fromObject({ seconds: stop.departureDelay }).as('minutes')))
                            : Math.ceil(Math.abs(Duration.fromObject({ seconds: stop.departureDelay }).as('minutes'))),
                        status: (stop.departureDelay < 0
                            ? 'early'
                            : stop.departureDelay < 60
                                ? 'on time'
                                : 'late') as DelayStatus,
                        lat: stop.stop.lat,
                        lon: stop.stop.lon,
                    }
                })
        });

        const walkOriginStops = walkRouteOrigins
            .filter(o => o.mode === 'WALK')
            .map(o => ({
                label: o.origin,
                transportName: null,
                mode: o.mode,
                modeData: o.modeData,
                scheduledStartTime: null,
                delayedStartTime: null,
                departureDelay: null,
                status: null,
                lat: o.geometry.coordinates[0],
                lon: o.geometry.coordinates[1]
            }));

        return [...transportOriginStops, ...walkOriginStops];
    }

    createTransportData(vehiclePositions: ExtendedVehiclePosition[]) {
        return vehiclePositions.map((vehicle: ExtendedVehiclePosition) => {
            const vehicleMode = vehicle.trip.route.mode as TransportMode;
            const labelKey = TRANSPORT_MODE[vehicleMode].name as keyof typeof vehicle.trip.route;
            const vehicleLabel = vehicle.trip.route[labelKey];
            return {
                label: vehicleLabel?.split(/[\/-]/)[0]?.replace(/\s/g, "")?.slice(0, 5) || null,
                heading: vehicle.heading,
                lat: vehicle.lat,
                lon: vehicle.lon,
                speed: vehicle.speed,
                mode: vehicle.trip.route.mode,
                modeData: TRANSPORT_MODE[vehicleMode],
                tripGeometry: polyline.decode(vehicle.tripGeometry.points) as [number, number][]
            }
        })
    }
}