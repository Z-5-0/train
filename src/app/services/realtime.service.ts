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
import { RouteSequence } from "../shared/models/route";
import { createTripPathQuery } from "../shared/constants/query/trip-path-query";
import { RealtimeStopTime, RealtimeTripData, RealtimeTripResponse, RealtimeVehiclePosition } from "../shared/models/api/response-realtime";
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
            map((resp: RealtimeTripResponse) => this.createRealtimeData(resp)),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    createRealtimeData(resp: RealtimeTripResponse): TripPath {
        if (!resp?.data) return null;

        const realtimeTrips: (RealtimeTripData | null)[] = resp.data ? Object.values(resp.data) : [];
        const nonWalkRealtimeTrips = realtimeTrips.filter((t): t is RealtimeTripData => t !== null);

        const tripsStoptimes = realtimeTrips
            .map((trip: RealtimeTripData | null) => trip?.stoptimes || []);

        const extendedVehicleData = nonWalkRealtimeTrips
            .flatMap((trip: RealtimeTripData) =>
                trip.vehiclePositions
                    .map((v: RealtimeVehiclePosition) => ({
                        ...v,
                        id: trip.id,
                        tripGeometry: trip.tripGeometry
                    }))
            );

        console.log('tripsStoptimes: ', tripsStoptimes);
        // console.log('2) ', extendedVehicleData);

        const originData = this.createOriginStopData(tripsStoptimes);
        const transportData = this.createTransportData(extendedVehicleData);

        console.log('3) ', { originData, transportData });

        return { originData, transportData };
    }

    createOriginStopData(tripsStoptimes: RealtimeStopTime[][]): TripPathOriginData[] {
        const route = this.routeService.getSelectedRoute();
        let previousDestinationPassed: boolean = false;

        const testing = (route?.sequences ?? []).map((seq: RouteSequence, index: number): TripPathOriginData => {
            const firstSequence = index === 0;
            // const lastSequence = index === (route?.sequences.length ? route.sequences.length - 1 : 0);
            const lastSequence = index === ((route?.sequences.length ?? 0) - 1);

            const prevSequence = route?.sequences[index - 1];
            const prevTransportModeData = TRANSPORT_MODE[prevSequence?.mode ?? 'WALK' as TransportMode];

            const arrivalStopInfo = tripsStoptimes[index - 1]?.find(f => f.stop.gtfsId == route?.sequences[index - 1].destination.gtfsId);
            const departureStopInfo = tripsStoptimes[index]?.find(f => f.stop.gtfsId === seq.origin.gtfsId) ?? null;

            const arrivingStopData = this.formatStoptimes(arrivalStopInfo, 'arrival');
            const leavingStopData = this.formatStoptimes(departureStopInfo, 'departure');

            const stopPassStatus = this.checkStopPassStatus(       // return {arrivalTransportIsPassed + departureTransportIsPassed}
                route?.sequences[index].transportInfo?.shortName || route?.sequences[index].transportInfo?.longName || '',
                index,
                tripsStoptimes[index],
                seq.origin, seq.destination,
                tripsStoptimes[index].at(-1)
            );

            console.log('stopPass: ', stopPassStatus);

            previousDestinationPassed = stopPassStatus.destinationStopPassed;

            return {
                label: seq.origin.name,
                arrivingTransportData: firstSequence
                    ? null
                    : {
                        transportName: prevSequence?.transportInfo?.[prevTransportModeData.name] ?? null,
                        mode: prevSequence?.mode ?? 'WALK',
                        modeData: prevTransportModeData,
                        ...arrivingStopData,
                        isPassed: previousDestinationPassed

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

        testing.push({
            label: route?.sequences[route?.sequences.length - 1].destination.name ?? null,
            leavingTransportData: {
                mode: route?.sequences[route?.sequences.length - 1].mode ?? 'WALK',
                modeData: TRANSPORT_MODE[route?.sequences[route?.sequences.length - 1].mode as TransportMode ?? 'WALK'],
                isPassed: previousDestinationPassed
            },
            arrivingTransportData: {
                transportName: route?.sequences[route?.sequences.length - 1].transportInfo?.[
                    TRANSPORT_MODE[route?.sequences[route?.sequences.length - 1].mode as TransportMode].name
                ] ?? null,
                mode: (route?.sequences[route?.sequences.length - 1].mode) as TransportMode,
                modeData: TRANSPORT_MODE[route?.sequences[route?.sequences.length - 1].mode as TransportMode],
                scheduledEndTime: null,
                delayedEndTime: null,
                arrivalDelay: null,
                status: null,
                isPassed: previousDestinationPassed
            },
            geometry: route?.sequences[route?.sequences.length - 1].destination.geometry ?? null
        });

        console.log('TESTING --> ', testing);

        return testing;
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

    formatStoptimes(stopInfo: any, mode: 'arrival' | 'departure'): ArrivalInfo | DepartureInfo {
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

    checkStopPassStatus(name: string, i: number, allStops: any, originStop: any, destnationStop: any, currentStop: any) {
        console.log('name: ', name,);
        console.log('i: ', i);
        console.log('allStops: ', allStops);
        console.log('originStop: ', originStop);
        console.log('destnationStop: ', destnationStop);
        console.log('stop: ', currentStop);

        if (!allStops.length) {
            return { originStopPassed: false, destinationStopPassed: false }
        }

        const transportFinished = DateTime.fromSeconds(
            currentStop.realtime
                ? currentStop.serviceDay + currentStop.realtimeDeparture
                : currentStop.serviceDay + currentStop.scheduledDeparture + currentStop.departureDelay
        )

        if (transportFinished < DateTime.now().setZone('Europe/Budapest')) {
            return { originStopPassed: true, destinationStopPassed: true };
        }

        const currentStopGtfsId = allStops.currentStopGtfsId;
        const originStopGtfsId = originStop.gtfsId;
        const destnationStopGtfsId = destnationStop.gtfsId;

        let currentStopIndex = null;
        let originStopIndex!: number;
        let destinationStopIndex!: number;

        allStops.forEach((stop: any, stopIndex: number) => {
            if (stop.stop.gtfsId === currentStopGtfsId) currentStopIndex = stopIndex;
            if (stop.stop.gtfsId === originStopGtfsId) originStopIndex = stopIndex;
            if (stop.stop.gtfsId === destnationStopGtfsId) destinationStopIndex = stopIndex;
        });

        console.log('INDEXES: ', currentStopIndex, originStopIndex, destinationStopIndex);
        console.log('stopPasses: ', stop);

        return {        // ha a menetidő letelt, mindkettő true mindig !
            originStopPassed: currentStopIndex !== null ? currentStopIndex > originStopIndex : false,
            destinationStopPassed: currentStopIndex !== null ? currentStopIndex > destinationStopIndex : false,
        }
    }
}