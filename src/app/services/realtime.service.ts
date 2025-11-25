import { inject, Injectable } from "@angular/core";
import { RouteService } from './route.service';
import { AppSettingsService } from './app-settings.service';
import { DateTime, Duration } from 'luxon';
import { TRANSPORT_MODE } from '../shared/constants/transport-mode';
import { RestApiService } from "./rest-api.service";
import { catchError, interval, map, Observable, of, startWith, switchMap, throwError } from "rxjs";
import { DelayStatus, PointGeometry, TransportMode } from "../shared/models/common";
import polyline from '@mapbox/polyline';
import { MessageService } from "./message.service";
import { OriginOrDestination, Route, RouteSequence } from "../shared/models/route";
import { createTripPathQuery } from "../shared/constants/query/trip-path-query";
import { RealtimeStoptime, RealtimeTripData, RealtimeTripResponse, RealtimeVehiclePosition } from "../shared/models/api/response-realtime";
import { ArrivalInfo, DepartureInfo, ExtendedVehiclePosition, TripPath, TripPathOriginData } from "../shared/models/trip-path";

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

    getRealtimeData(): Observable<TripPath | null> {
        const ids = this.routeService.getSelectedTripIds();

        if (!ids.length) {
            return of(null);
        }

        return this.restApi.getTripPath({
            body: {
                query: createTripPathQuery(ids),
                variables: {}
            },
            debounceTime: false
        }).pipe(
            map((response: RealtimeTripResponse) => this.createRealtimeData(response)),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    createRealtimeData(response: RealtimeTripResponse): TripPath {
        if (!response?.data) return null;

        const realtimeTrips: (RealtimeTripData | null)[] = response.data ? Object.values(response.data) : [];
        const nonWalkRealtimeTrips = realtimeTrips.filter((t): t is RealtimeTripData => t !== null);

        const tripStatusData = realtimeTrips.map((trip: RealtimeTripData | null) => {
            return {
                tripsStoptimes: trip ? trip.stoptimes : [],
                currentStopGtfsId: trip ? trip.vehiclePositions[trip.vehiclePositions.length - 1]?.stopRelationship.stop.gtfsId : null
            }
        });

        const extendedVehicleData = nonWalkRealtimeTrips
            .flatMap((trip: RealtimeTripData) =>
                trip.vehiclePositions
                    .map((v: RealtimeVehiclePosition) => ({
                        ...v,
                        id: trip.id,
                        tripGeometry: trip.tripGeometry
                    }))
            );

        const originData = this.createOriginStopData(tripStatusData);
        const transportData = this.createTransportData(extendedVehicleData);

        return { originData, transportData };
    }

    createOriginStopData(tripsData: { tripsStoptimes: RealtimeStoptime[]; currentStopGtfsId: string | null }[]): TripPathOriginData[] {
        // ha nincs sequences, vagy más egyéb, vissza kellene térni

        const route: Route | null = this.routeService.getSelectedRoute();
        let previousTransportFinished: boolean = false;

        const tripPath = (route?.sequences ?? []).map((seq: RouteSequence, index: number): TripPathOriginData => {
            const firstSequence = index === 0;
            const prevSequence = index > 0 ? route?.sequences[index - 1] : null;
            const prevTransportModeData = prevSequence ? TRANSPORT_MODE[prevSequence?.mode as TransportMode] : null;

            const previousTrip = index > 0 ? tripsData[index - 1] : null;
            const currentTrip = tripsData[index];

            const arrivalStopInfo: RealtimeStoptime | null = previousTrip
                ? previousTrip.tripsStoptimes.find((tripStop: RealtimeStoptime) => tripStop.stop.gtfsId === prevSequence?.destination.gtfsId) ?? null
                : null;
            const departureStopInfo: RealtimeStoptime | null = currentTrip.tripsStoptimes.find((tripStop: RealtimeStoptime) => tripStop.stop.gtfsId === seq.origin.gtfsId
            ) ?? null;

            const arrivingStopData = this.formatStoptimes(arrivalStopInfo, 'arrival');
            const leavingStopData = this.formatStoptimes(departureStopInfo, 'departure');

            const stopPassStatus = this.checkStopPassStatus(currentTrip, seq.origin, seq.destination);

            previousTransportFinished = stopPassStatus.destinationStopPassed;

            return {
                label: seq.origin.name,
                arrivingTransportData: firstSequence
                    ? null
                    : {
                        transportName: prevSequence?.transportInfo?.[prevTransportModeData?.name as TransportMode] ?? null,
                        mode: prevSequence?.mode ?? 'WALK',
                        modeData: prevTransportModeData,
                        ...arrivingStopData,
                        isPassed: previousTransportFinished

                    },
                leavingTransportData:
                {
                    transportName: seq?.transportInfo?.[TRANSPORT_MODE[seq.mode as TransportMode].name] ?? null,
                    mode: seq.mode,
                    modeData: TRANSPORT_MODE[seq.mode as TransportMode],
                    ...leavingStopData,
                    isPassed: stopPassStatus.originStopPassed
                },
                geometry: seq.origin.geometry
            }
        });

        const destinationStopGtfsId = route?.sequences.at(-1)?.destination.gtfsId;
        const destinationStopData = tripsData
            .at(-1)?.tripsStoptimes
            .find((stop: RealtimeStoptime) => stop.stop.gtfsId === destinationStopGtfsId) ?? null;
        this.formatStoptimes(destinationStopData, 'arrival');

        const lastStopTransportArrivalData = this.formatStoptimes(destinationStopData, 'arrival') as ArrivalInfo;

        tripPath.push({
            label: route?.sequences[route?.sequences.length - 1].destination.name ?? null,
            leavingTransportData: null,
            arrivingTransportData: {
                transportName: route?.sequences[route?.sequences.length - 1].transportInfo?.[
                    TRANSPORT_MODE[route?.sequences[route?.sequences.length - 1].mode as TransportMode].name
                ] ?? null,
                mode: (route?.sequences[route?.sequences.length - 1].mode) as TransportMode,
                modeData: TRANSPORT_MODE[route?.sequences[route?.sequences.length - 1].mode as TransportMode],
                scheduledEndTime: lastStopTransportArrivalData.scheduledEndTime,
                delayedEndTime: lastStopTransportArrivalData.delayedEndTime,
                arrivalDelay: lastStopTransportArrivalData.arrivalDelay,
                status: lastStopTransportArrivalData.status,
                isPassed: previousTransportFinished
            },
            geometry: route?.sequences[route?.sequences.length - 1].destination.geometry ?? null
        });

        return tripPath;
    }

    createTransportData(vehiclePositions: ExtendedVehiclePosition[]) {
        return vehiclePositions.map((vehicle: ExtendedVehiclePosition) => {
            const vehicleMode = vehicle.trip.route.mode as TransportMode;
            const labelKey = TRANSPORT_MODE[vehicleMode].name as keyof typeof vehicle.trip.route;
            const vehicleLabel = vehicle.trip.route[labelKey];
            return {
                label: vehicleLabel?.split(/[\/-]/)[0]?.replace(/\s/g, "")?.slice(0, 5) || null,
                heading: vehicle.heading ?? null,
                speed: vehicle.speed ?? null,
                mode: vehicle.trip.route.mode,
                modeData: TRANSPORT_MODE[vehicleMode],
                geometry: {
                    type: 'Point',
                    coordinates: [vehicle.lat, vehicle.lon]
                } as PointGeometry,
                tripGeometry: polyline.decode(vehicle.tripGeometry.points) as [number, number][]
            }
        })
    }

    formatStoptimes(stopInfo: RealtimeStoptime | null, mode: 'arrival' | 'departure'): ArrivalInfo | DepartureInfo {
        const objs: { arrival: ArrivalInfo; departure: DepartureInfo } = {
            arrival: {
                scheduledEndTime: null,
                delayedEndTime: null,
                arrivalDelay: null,
                status: null
            },
            departure: {
                scheduledStartTime: null,
                delayedStartTime: null,
                departureDelay: null,
                status: null
            }
        };

        if (!stopInfo) {
            return objs[mode];
        }

        if (mode === 'arrival') {
            objs[mode].scheduledEndTime = DateTime.fromSeconds(stopInfo.serviceDay + stopInfo.scheduledArrival)
                .setZone('Europe/Budapest')
                .toFormat('HH:mm');
            objs[mode].delayedEndTime = DateTime.fromSeconds(
                stopInfo.realtime
                    ? stopInfo.serviceDay + stopInfo.realtimeArrival
                    : stopInfo.serviceDay + stopInfo.scheduledArrival + stopInfo.arrivalDelay
            )
                .setZone('Europe/Budapest')
                .toFormat('HH:mm');
            objs[mode].arrivalDelay = (stopInfo.arrivalDelay > 0)
                ? Math.floor(Math.abs(Duration.fromObject({ seconds: stopInfo.arrivalDelay }).as('minutes')))
                : Math.ceil(Math.abs(Duration.fromObject({ seconds: stopInfo.arrivalDelay }).as('minutes')));
            objs[mode].status = (stopInfo.arrivalDelay < 0
                ? 'early'
                : stopInfo.arrivalDelay < 60
                    ? 'on time'
                    : 'late') as DelayStatus;
        }

        if (mode === 'departure') {
            objs[mode].scheduledStartTime = DateTime.fromSeconds(stopInfo.serviceDay + stopInfo.scheduledDeparture)
                .setZone('Europe/Budapest')
                .toFormat('HH:mm');
            objs[mode].delayedStartTime = DateTime.fromSeconds(
                stopInfo.realtime
                    ? stopInfo.serviceDay + stopInfo.realtimeDeparture
                    : stopInfo.serviceDay + stopInfo.scheduledDeparture + stopInfo.departureDelay
            )
                .setZone('Europe/Budapest')
                .toFormat('HH:mm');
            objs[mode].departureDelay = (stopInfo.departureDelay > 0)
                ? Math.floor(Math.abs(Duration.fromObject({ seconds: stopInfo.departureDelay }).as('minutes')))
                : Math.ceil(Math.abs(Duration.fromObject({ seconds: stopInfo.departureDelay }).as('minutes')));
            objs[mode].status = (stopInfo.departureDelay < 0
                ? 'early'
                : stopInfo.departureDelay < 60
                    ? 'on time'
                    : 'late') as DelayStatus;
        }

        return objs[mode];
    }

    checkStopPassStatus(
        tripData: { tripsStoptimes: RealtimeStoptime[]; currentStopGtfsId: string | null },
        originStop: OriginOrDestination,
        destinationStop: OriginOrDestination
    ) {
        const { tripsStoptimes, currentStopGtfsId } = tripData;

        // if (!tripsStoptimes.length || !tripData.currentStopGtfsId) {
        if (!tripsStoptimes.length) {
            return { originStopPassed: false, destinationStopPassed: false }
        }

        const lastTripStop = tripsStoptimes.at(-1);
        if (!lastTripStop) return { originStopPassed: false, destinationStopPassed: false };

        const transportFinished = DateTime.fromSeconds(
            lastTripStop.realtime
                ? lastTripStop.serviceDay + lastTripStop.realtimeDeparture
                : lastTripStop.serviceDay + lastTripStop.scheduledDeparture + lastTripStop.departureDelay
        )

        const now = DateTime.now().setZone('Europe/Budapest');

        if (transportFinished < now) {
            return { originStopPassed: true, destinationStopPassed: true };
        }

        const originStopGtfsId = originStop.gtfsId;
        const destnationStopGtfsId = destinationStop.gtfsId;

        let currentStopIndex: number | null = null;
        let originStopIndex: number | null = null;
        let destinationStopIndex: number | null = null;

        for (let i = 0; i < tripsStoptimes.length; i++) {
            const id = tripsStoptimes[i].stop.gtfsId;
            if (id === currentStopGtfsId) currentStopIndex = i;
            if (id === originStopGtfsId) originStopIndex = i;
            if (id === destnationStopGtfsId) destinationStopIndex = i;
        }

        return {
            originStopPassed: currentStopIndex != null && originStopIndex != null
                ? currentStopIndex > originStopIndex
                : false,
            destinationStopPassed: currentStopIndex != null && destinationStopIndex != null
                ? currentStopIndex > destinationStopIndex
                : false,
        }
    }
}