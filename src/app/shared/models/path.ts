import { DateTime } from "luxon";
import { DelayStatus, ModeData, TransportMode } from "./common";

export interface RoutePath {
    startTime: string;           // 'HH:mm' format
    startTimestamp: number;      // UNIX stimestamp
    endTime: string;         // 'HH:mm' format
    endTimestamp: number;        // UNIX stimestamp
    waitingTime: number;         // min
    walkTime: number;            // min
    walkTimeInMinutes: number;
    waitingTimeInMinutes: number;
    sequences: RoutePathSequence[]
}
export interface RoutePathSequence {
    index: number;
    // arrivalDelay: number;       // min
    departureDelay: number;     // min
    scheduledStartTime: string;
    delayedStartTime: string;
    delayedDateTime: DateTime;
    status: DelayStatus;
    mode: TransportMode;
    modeData: ModeData;
    realTime: boolean;
    serviceDay: number;         // UNIX timestamp
    from: RoutePathLocation,
    to: RoutePathLocation,
    route: {
        id: string,
        mode: TransportMode,
        longName: string,
        shortName: string,
        color: string,
        textColor: string
    } | null,
    trip: {
        gtfsId: string,
        id: string,
        tripHeadsign: string,
        route: {
            color: string,
            shortName: string
        }
    } | null,
    intermediateStops: IntermediateStop[] | null;
    sequenceGeometry: {
        length: number,
        points: [number, number][];
    }
}
interface RoutePathLocation {
    name: string;
    lat: number;
    lon: number;
    stop: RoutePathStop;
}
interface RoutePathStop {
    gtfsId: string;
}
export interface IntermediateStop {
    id: string;
    name: string;
    geometry: {
        type: 'Point',
        coordinates: [number, number]
    }
}