import { inject, Injectable } from "@angular/core";
import { catchError, EMPTY, interval, map, Observable, shareReplay, startWith, switchMap, tap } from "rxjs";
import { createPlanQuery } from "../shared/constants/query/plan-query";
import { Trip, TripResponse } from "../shared/models/api/response-trip";
import { CurrentTrip, StopStatus } from "../shared/models/trip";
import { DelayStatus, PointGeometry } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { DateTime, Duration } from "luxon";
import { RestApiService } from "./rest-api.service";

@Injectable({
    providedIn: 'root',
})
export class TripService {
    private restApi: RestApiService = inject(RestApiService);

    public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;

    getTripPolling(gtfsId: string | null): Observable<CurrentTrip> {
        if (!gtfsId) {
            return EMPTY;
        }

        // 5 másodpercenként hívja meg a getTrip-et, azonnal is indul az első hívás
        return interval(5000).pipe(
            tap(() => console.log('Polling trigger')),
            startWith(0),
            switchMap(() => this.getTrip(gtfsId).pipe(
                catchError(err => {
                    console.error('getTrip hiba:', err);
                    return EMPTY; // hibánál se álljon le a polling
                })
            )),
            // Megosztja az előfizetők között az adatfolyamot, hogy ne indítsa el többször a lekérést
            shareReplay({ bufferSize: 1, refCount: true })
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
            map((response: TripResponse) => this.transformTripResponse(response.data.trip))
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