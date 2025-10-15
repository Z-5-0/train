import { TransportMode } from "../common";

export interface RoutePathApiResponse {
    data: RoutePathData;
}

interface RoutePathData {
    plan: RoutePathPlan;
}

interface RoutePathPlan {
    itineraries: RoutePathItinerary[];
    routingErrors: unknown[];
    routingWarnings: unknown[];
}

export interface RoutePathItinerary {
    startTime: number;      // UNIX timestamp
    endTime: number;        // UNIX timestamp
    waitingTime: number;    // s
    walkTime: number;       // s
    legs: RoutePathLeg[];
}

export interface RoutePathLeg {
    startTime: number;          // UNIX timestamp
    endTime: number;            // UNIX timestamp
    arrivalDelay: number;       // s
    departureDelay: number;     // s
    mode: TransportMode;
    realTime: boolean;
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
    legGeometry: {
        length: number,
        points: string
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