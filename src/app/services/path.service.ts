import { inject, Injectable } from "@angular/core";
import { ROUTE_PATH_QUERY } from '../shared/constants/query/route-path-query';
import { RouteService } from './route.service';
import { AppSettingsService } from './app-settings.service';
import { DateTime, Duration } from 'luxon';
import { TRANSPORT_MODE } from '../shared/constants/transport-mode';
import { RestApiService } from "./rest-api.service";
import { catchError, delayWhen, interval, map, Observable, of, retry, retryWhen, startWith, switchMap, take, tap, throwError, timer } from "rxjs";
import { RoutePathApiResponse, RoutePathItinerary, RoutePathLeg } from "../shared/models/api/response-path";
import { RoutePath } from "../shared/models/path";
import { DelayStatus, TransportMode } from "../shared/models/common";
import polyline from '@mapbox/polyline';
import { MessageService } from "./message.service";


@Injectable({
    providedIn: 'root',
})
export class PathService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);
    private messageService: MessageService = inject(MessageService);

    getRoutePathPolling() {
        return this.appSettingsService.appSettings$.pipe(
            map(settings => settings['updateTime']),
            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getRoutePath())
                )
            )
        );
    }

    getRoutePath(): Observable<RoutePath | null> {
        const [date, time] = [
            this.routeService.getRouteSearchDateTime()?.split(' ')[0],
            this.routeService.getRouteSearchDateTime()?.split(' ')[1]
        ];

        const { name: originName, id: originId } = this.routeService.getSelectedPlace().originPlace || {};
        const { name: destinationName, id: destinationId } = this.routeService.getSelectedPlace().destinationPlace || {};

        const { alternativeRoutes, walkSpeed } = this.appSettingsService.currentAppSettings;

        const variables = {
            fromPlace: `${originName}::${originId}`,
            toPlace: `${destinationName}::${destinationId}`,
            date,
            // time,
            time,
            modes: Object.keys(TRANSPORT_MODE)
                .filter(mode => !['GPS', 'ERROR'].includes(mode))
                .map(includedMode => {    // .map(mode => ({ mode }))
                    return { mode: includedMode }
                }),
            numItineraries: alternativeRoutes * 2,
            walkSpeed: walkSpeed / 3.6,
            distributionChannel: 'ERTEKESITESI_CSATORNA#INTERNET',
            distributionSubChannel: 'ERTEKESITESI_ALCSATORNA#EMMA',
            minTransferTime: 0,
            arriveBy: false,
            transitPassFilter: [],
            comfortLevels: [],
            searchParameters: [],
            banned: {}
        };

        return this.restApi.getRoutePath({
            body: {
                query: ROUTE_PATH_QUERY,
                variables: variables
            },
            debounceTime: false
        }).pipe(
            map((resp: RoutePathApiResponse) => {
                const itineraryMatched = resp.data.plan.itineraries.find(
                    (itinerary: RoutePathItinerary) => {
                        const key = `${itinerary.legs.length}_` + itinerary.legs
                            .map(leg => leg.trip?.id ?? '0')
                            .join('_');

                        console.log('RESPONSE: ', `${key}`);
                        console.log('ROUTE: ', this.routeService.getSelectedRouteKey());
                        console.log('----- -----', `${key}` === this.routeService.getSelectedRouteKey(), '----- -----')
                        return `${key}` === this.routeService.getSelectedRouteKey()
                    }
                );

                console.log('*** ' + itineraryMatched + ' ***');

                if (!itineraryMatched) {
                    // Trigger retry
                    // throw new Error('No matching itinerary found yet');
                    this.messageService.showError('!');
                }

                return itineraryMatched;
                /* return resp.data.plan.itineraries.find(
                    (itinerary: RoutePathItinerary) => `${itinerary.endTime}_${itinerary.legs.length}_${itinerary.walkTime}` === this.routeService.getSelectedRouteKey()
                ); */
            }),
            switchMap(itineraryMatched => {
                if (!itineraryMatched) {
                    return throwError(() => new Error('No matching itinerary found yet'));
                }
                return of(itineraryMatched);
            }),
            map((itinerary: RoutePathItinerary | undefined) => this.createRoutePathSequence(itinerary)),
            // tap(t => console.log(t)),       // TODO DELETE
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
            })
        )
    }

    createRoutePathSequence(itinerary: RoutePathItinerary | undefined) {
        if (!itinerary) return null;

        const intermediateStopSequences = this.routeService.getSelectedRoute()?.sequences.map(
            seq => seq.stops?.slice(1, -1) || null      // start from index 1 and stop before the last index
        );

        return {
            startTime: DateTime.fromMillis(itinerary.startTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
            startTimestamp: itinerary.startTime,
            endTime: DateTime.fromMillis(itinerary.endTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
            endTimestamp: itinerary.endTime,
            waitingTime: itinerary.waitingTime,
            walkTime: itinerary.walkTime,
            walkTimeInMinutes: Math.ceil(Duration.fromObject({ seconds: itinerary.walkTime }).as('minutes')),
            sequences: itinerary.legs.map((leg: RoutePathLeg, index: number) => {
                return {
                    index,
                    scheduledStartTime: DateTime.fromMillis(
                        leg.startTime -
                        (
                            (leg.departureDelay < 0
                                ? Math.ceil(Math.abs(leg.departureDelay) / 60) * -1
                                : Math.floor(leg.departureDelay / 60)) * 60 * 1000
                        )
                    )
                        .setZone('Europe/Budapest')
                        .toFormat('HH:mm'),
                    delayedStartTime: DateTime.fromMillis(
                        leg.realTime
                            ? leg.startTime
                            : leg.startTime + (
                                (leg.departureDelay < 0
                                    ? Math.ceil(Math.abs(leg.departureDelay) / 60) * -1
                                    : Math.floor(leg.departureDelay / 60)
                                ) * 60 * 1000
                            )
                    )
                        .setZone('Europe/Budapest')
                        .toFormat('HH:mm'),
                    delayedDateTime: DateTime.fromMillis(
                        leg.realTime
                            ? leg.startTime
                            : leg.startTime + (
                                (leg.departureDelay < 0
                                    ? Math.ceil(Math.abs(leg.departureDelay) / 60) * -1
                                    : Math.floor(leg.departureDelay / 60)
                                ) * 60 * 1000
                            )
                    ).setZone('Europe/Budapest'),
                    departureDelay: leg.departureDelay < 0
                        ? Math.ceil(Math.abs(leg.departureDelay) / 60) * -1
                        : Math.floor(leg.departureDelay / 60),
                    status: (
                        (leg.departureDelay < 0
                            ? Math.ceil(Math.abs(leg.departureDelay) / 60) * -1
                            : Math.floor(leg.departureDelay / 60)) < 0
                            ? 'early'
                            : (Math.abs(leg.departureDelay) < 60)
                                ? 'on time'
                                : 'late'
                    ) as DelayStatus,
                    mode: leg.mode as TransportMode,
                    modeData: TRANSPORT_MODE[leg.mode],
                    realTime: leg.realTime,
                    serviceDay: Math.floor(DateTime.fromMillis(leg.startTime, { zone: 'Europe/Budapest' }).startOf('day').toSeconds()),
                    from: {
                        name: leg.from.name,
                        lat: leg.from.lat,
                        lon: leg.from.lon,
                        stop: {
                            gtfsId: leg.from.stop.gtfsId
                        }
                    },
                    to: {
                        name: leg.to.name,
                        lat: leg.to.lat,
                        lon: leg.to.lon,
                        stop: {
                            gtfsId: leg.to.stop.gtfsId
                        }
                    },
                    route: leg.route
                        ? {
                            id: leg.route.id,
                            mode: leg.route.mode as TransportMode,
                            longName: leg.route.longName,
                            shortName: leg.route.shortName,
                            color: leg.route.color,
                            textColor: leg.route.textColor
                        }
                        : null,
                    trip: leg.trip
                        ? {
                            gtfsId: leg.trip.gtfsId,
                            id: leg.trip.id,
                            tripHeadsign: leg.trip.tripHeadsign,
                            route: {
                                color: leg.trip.route.color,
                                shortName: leg.trip.route.shortName
                            }
                        }
                        : null,
                    intermediateStops: intermediateStopSequences ? intermediateStopSequences[index] : null,
                    sequenceGeometry: {
                        length: leg.legGeometry.length,
                        points: polyline.decode(leg.legGeometry.points) as [number, number][]
                    }
                }
            })
        };
    }
}