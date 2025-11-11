import { inject, Injectable } from "@angular/core";
import { RouteService } from './route.service';
import { DateTime, Duration } from 'luxon';
import { TRANSPORT_MODE } from '../shared/constants/transport-mode';
import { map, Observable } from "rxjs";
import { RoutePath } from "../shared/models/path";
import { DelayStatus, TransportMode } from "../shared/models/common";
import { Route } from "../shared/models/route";


@Injectable({
    providedIn: 'root',
})
export class PathService {
    private routeService: RouteService = inject(RouteService);

    public readonly routePath$: Observable<RoutePath | null>;

    constructor() {
        this.routePath$ = this.routeService.selectedRoute$.pipe(
            map(route => route ? this.createRoutePath(route) : null),
        );
    }

    createRoutePath(route: Route | null): RoutePath | null {
        if (!route) return null;

        const toMinutes = (seconds?: number) =>
            Math.ceil(Duration.fromObject({ seconds: seconds ?? 0 }).as('minutes'));

        const toDelayedDateTime = (time?: string, delay?: number) =>
            DateTime.fromFormat(time ?? '00:00', 'HH:mm', { zone: 'Europe/Budapest' })
                .plus({ minutes: ((delay ?? 0) < 0 ? Math.ceil(Math.abs(delay ?? 0) / 60) * -1 : Math.floor((delay ?? 0) / 60)) });

        return {
            startTime: route.startTime,
            startTimestamp: route.startTimestamp,
            endTime: route.endTime,
            endTimestamp: route.endTimeTimestamp,
            waitingTime: route.walkTime,
            waitingTimeInMinutes: toMinutes(route.walkTimeInSeconds),
            walkTime: route.waitingTime,
            walkTimeInMinutes: toMinutes(route.walkTimeInSeconds),
            sequences: route.sequences.map((seq, index) => ({
                index,
                realTime: seq.realTime,
                mode: seq.mode,
                modeData: TRANSPORT_MODE[seq.mode as TransportMode],
                status: seq.origin.status as DelayStatus,
                scheduledStartTime: seq.origin.scheduledStartTime || '',
                delayedStartTime: seq.origin.delayedStartTime || '',
                delayedDateTime: toDelayedDateTime(seq.origin.scheduledStartTime, seq.origin.departureDelay),
                departureDelay: seq.origin.departureDelay ?? 0,
                serviceDay: DateTime.now().toUTC().startOf('day').toMillis(),
                from: {
                    name: seq.origin.name,
                    lat: seq.origin.geometry.coordinates[0],
                    lon: seq.origin.geometry.coordinates[1],
                    stop: { gtfsId: seq.origin.gtfsId || '' }
                },
                to: {
                    name: seq.destination.name,
                    lat: seq.destination.geometry.coordinates[0],
                    lon: seq.destination.geometry.coordinates[1],
                    stop: { gtfsId: seq.destination.gtfsId || '' }
                },
                route: {
                    id: seq.transportInfo?.routeId || '',
                    mode: seq.mode,
                    shortName: seq.transportInfo?.shortName || '',
                    longName: seq.transportInfo?.longName || '',
                    color: seq.transportInfo?.backgroundColor || '',
                    textColor: seq.transportInfo?.textColor || ''
                },
                trip: {
                    gtfsId: seq.transportInfo?.gtfsId || '',
                    id: seq.transportInfo?.tripId || '',
                    tripHeadsign: seq.transportInfo?.headSign || '',
                    route: {
                        color: seq.transportInfo?.backgroundColor || '',
                        shortName: seq.transportInfo?.shortName || ''
                    }
                },
                intermediateStops: (seq.stops?.slice?.(1, -1) ?? []).map((s) => ({
                    id: s.id,
                    name: s.name,
                    geometry: s.geometry
                })),
                sequenceGeometry: {
                    length: seq.sequenceGeometry.length,
                    points: seq.sequenceGeometry.points
                }
            }))
        };
    }
}