import { inject, Injectable } from "@angular/core";
import { catchError, distinctUntilChanged, EMPTY, interval, map, Observable, of, shareReplay, startWith, switchMap, tap, throwError } from "rxjs";
import { createPlanQuery } from "../shared/constants/query/plan-query";
import { Trip, TripResponse } from "../shared/models/api/response-trip";
import { CurrentTrip, StopStatus } from "../shared/models/trip";
import { DelayStatus, PointGeometry } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { DateTime, Duration } from "luxon";
import { RestApiService } from "./rest-api.service";
import { AppSettingsService } from "./app-settings.service";

@Injectable({
    providedIn: 'root',
})
export class TripService {
    private restApi: RestApiService = inject(RestApiService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);

    public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;

    getTripPolling(gtfsId: string | null): Observable<CurrentTrip> {
        if (!gtfsId) {
            return EMPTY;
        }

        return this.appSettingsService.appSettings$.pipe(
            map(settings => Number(settings['tripUpdateTime'])),
            // distinctUntilChanged(),
            tap(ms => console.log('Trip polling / interval (ms): ', ms)),

            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getTrip(gtfsId))
                ),
            ),

            shareReplay({ bufferSize: 1, refCount: true })      // Shares the stream between subscribers to avoid triggering multiple requests
        );
    }

    getTrip(gtfsId: string | null): Observable<CurrentTrip> {
        if (!gtfsId) {
            // TODO MESSAGE
            return EMPTY;
        }

        return this.restApi.getTrip({
            body: {
                query: createPlanQuery(gtfsId),
                variables: {}
            }
        }).pipe(
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
            alerts,
            route,
            stoptimes,
            tripShortName,
            vehiclePositions,
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
                endDate: DateTime.fromSeconds(alert.effectiveEndDate).toFormat('yyyy-LL-dd HH:mm'),
                endProgress: Number(Math.min(
                    Math.max(
                        ((Date.now() / 1000 - alert.effectiveStartDate) / (alert.effectiveEndDate - alert.effectiveStartDate)) * 100,
                        0
                    ),
                    100
                ).toFixed(2))
            })),
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