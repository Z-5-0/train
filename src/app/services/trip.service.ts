import { inject, Injectable } from "@angular/core";
import { catchError, EMPTY, interval, map, Observable, startWith, switchMap, take, tap, throwError } from "rxjs";
import { createTripQuery } from "../shared/constants/query/trip-query";
import { Trip, TripResponse } from "../shared/models/api/response-trip";
import { CurrentTrip, ServiceStatusKey, StopStatus } from "../shared/models/trip";
import { DelayStatus, PointGeometry } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { DateTime, Duration } from "luxon";
import { RestApiService } from "./rest-api.service";
import { AppSettingsService } from "./app-settings.service";
import { SERVICE_CODE } from "../shared/constants/service-code";
import { SERVICE_STATUS } from "../shared/constants/service.status";
import { GraphQLErrorService } from "./graphql-error.service";

@Injectable({
    providedIn: 'root',
})
export class TripService {
    private restApi: RestApiService = inject(RestApiService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);
    private graphQLErrorService: GraphQLErrorService = inject(GraphQLErrorService);

    public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;

    getTripPolling(gtfsId: string): Observable<CurrentTrip> {
        return this.appSettingsService.appSettings$.pipe(
            map(settings => settings['updateTime']),
            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getTrip(gtfsId))
                )
            )
        );
    }

    getTrip(gtfsId: string | null): Observable<CurrentTrip> {
        if (!gtfsId) {
            // TODO MESSAGE
            return EMPTY;
        }

        return this.restApi.getTrip({
            body: {
                query: createTripQuery(gtfsId),
                variables: {}
            },
            debounceTime: false
        }).pipe(
            tap((response: TripResponse) => this.graphQLErrorService.handleErrors('getTrip', response)),
            map((response: TripResponse) => this.transformTripResponse(response.data.trip)),
            catchError(err => {     // does not run due to retry in rest-api service
                // return EMPTY;
                return throwError(() => err);       // pushes error towards components
            })
        );
    }

    transformTripResponse(trip: Trip) {
        const {
            id,
            bikesAllowed,
            alerts,
            infoServices,
            route,
            stoptimes,
            tripShortName,
            vehiclePositions,
            wheelchairAccessible
        } = trip;

        const vehicle = vehiclePositions?.[0];
        const stop = vehicle?.stopRelationship?.stop;
        const tripData = vehicle?.trip;

        return {
            gtfsId: id,
            tripShortName,    // TODO trim() ???
            alerts: (alerts ?? []).map(alert => ({
                text: alert.alertDescriptionText,
                severityLevel: alert.alertSeverityLevel,
                startDate: DateTime.fromSeconds(alert.effectiveStartDate).toFormat('yyyy-LL-dd HH:mm'),
                endDate: alert.effectiveEndDate ? DateTime.fromSeconds(alert.effectiveEndDate).toFormat('yyyy-LL-dd HH:mm') : null,     // could be null
                endProgress: alert.effectiveEndDate ?
                    Number(Math.min(
                        Math.max(
                            ((Date.now() / 1000 - alert.effectiveStartDate) / (alert.effectiveEndDate - alert.effectiveStartDate)) * 100,
                            0
                        ),
                        100
                    ).toFixed(2)) : null
            })),
            services: {
                bikesAllowed: SERVICE_STATUS[bikesAllowed as ServiceStatusKey || 'UNKNOWN'],
                wheelchairAccessible: SERVICE_STATUS[wheelchairAccessible as ServiceStatusKey || 'UNKNOWN'],
                info: (infoServices ?? [])
                    .filter(service => service.displayable)
                    .map(service => {
                        return {
                            index: (SERVICE_CODE[service.fontCode ?? 0] ?? SERVICE_CODE[0]).index,
                            name: service.name
                                ? service.name[0].toUpperCase() + service.name.slice(1)
                                : '',
                            icon: (SERVICE_CODE[service.fontCode ?? 0] ?? SERVICE_CODE[0]).icon,
                            color: (SERVICE_CODE[service.fontCode ?? 0] ?? SERVICE_CODE[0]).color,
                            fromStopName: service.fromStop?.name ?? 'Unknown',
                            tillStopName: service.tillStop?.name ?? 'Unknown',
                        }
                    })
                    .sort((a, b) => a.index - b.index)
                /* info: [
                    {
                        name: 'name',
                        icon: 'icon',
                        fromStopName: 'fromStopName',
                        tillStopName: 'tillStopName'
                    }
                ] */
            },
            allStops: stoptimes?.map((
                { arrivalDelay,
                    departureDelay,
                    realtime,
                    realtimeArrival,
                    realtimeDeparture,
                    realtimeState,
                    scheduledArrival,
                    scheduledDeparture,
                    serviceDay,
                    stop
                }) => ({
                    arrivalDelay,
                    departureDelay,
                    realtime,
                    realtimeArrival,
                    realtimeDeparture,
                    realtimeState,
                    scheduledArrival,
                    scheduledDeparture,
                    serviceDay,
                    station: {
                        alerts: stop.alerts,
                        geometries: stop.geometries?.geoJson,
                        name: stop.name,
                        platformCode: stop.platformCode,
                        gtfsId: stop.stopId,
                        isPassed: false,
                        isArrived: false,
                        tripStop: false,
                    },
                    delay: {
                        /* scheduledStartTime: realtime
                            ? DateTime.fromSeconds(serviceDay + realtimeDeparture - departureDelay, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
                            : DateTime.fromSeconds(serviceDay + scheduledDeparture, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
                        delayedStartTime: realtime
                            ? DateTime.fromSeconds(serviceDay + realtimeDeparture, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
                            : DateTime.fromSeconds(serviceDay + scheduledDeparture + departureDelay, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'), */
                        scheduledStartTime: realtime
                            ? DateTime.fromSeconds(serviceDay + realtimeDeparture - departureDelay, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
                            : DateTime.fromSeconds(serviceDay + scheduledDeparture, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
                        delayedStartTime: realtime
                            ? DateTime.fromSeconds(serviceDay + realtimeDeparture, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
                            : DateTime.fromSeconds(serviceDay + scheduledDeparture + departureDelay, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
                        delayedDateTime: DateTime.fromSeconds(serviceDay + realtimeDeparture, { zone: 'utc' }).setZone('Europe/Budapest'),
                        departureDelay: (departureDelay > 0)
                            ? Math.floor(Math.abs(Duration.fromObject({ seconds: departureDelay }).as('minutes')))
                            : Math.ceil(Math.abs(Duration.fromObject({ seconds: departureDelay }).as('minutes'))),
                        status: departureDelay < 0
                            ? 'early'
                            : departureDelay < 60
                                ? 'on time'
                                : 'late' as DelayStatus
                    }
                    // 1-59 között ne legyen
                })) ?? [],
            transportInfo: {
                transportId: vehicle?.vehicleId ?? null,
                lastUpdated: vehicle?.lastUpdated ?? null,
                mode: route.mode,
                position: {
                    heading: vehicle?.heading ?? null,
                    geometry: {
                        type: 'Point',
                        coordinates: [
                            vehicle?.lat ?? 0,
                            vehicle?.lon ?? 0
                        ] as [number, number]
                    } as PointGeometry
                },
                station: {
                    gtfsId: stop?.gtfsId ?? null,
                    name: stop?.name ?? null,
                },
                trip: {
                    tripId: tripData?.gtfsId ?? null,
                    tripShortName: tripData?.tripShortName ?? null,
                },
                vehicle: {
                    name: (route as any)[this.transportMode[route.mode].name].split(/[\/-]/)[0] ?? '',
                    shortName: (route as any)[this.transportMode[route.mode].name]?.replace(/\s/g, "")?.slice(0, 5) ?? '',
                    textColor: `#${route.textColor}`,
                    backgroundColor: `#${route.color}`,
                    speed: vehicle?.speed ? (vehicle.speed * 3.6).toFixed(0) : '0',
                    status: vehicle?.stopRelationship?.status as StopStatus,
                },
                isFinished: false
            }
        };
    }
}