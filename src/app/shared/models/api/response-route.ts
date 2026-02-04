import { TransportMode } from "../common";

export interface RouteApiResponse {
    data: {
        plan: {
            itineraries: Itinerary[];
        };
    };
}

export interface Itinerary {
    numberOfTransfers: number;
    duration: number;
    startTime: number;
    endTime: number;
    walkTime: number;
    waitingTime: number;
    legs: Leg[];
}

export interface Leg {
    realTime: boolean;
    startTime: number;
    departureDelay: number;
    mode: TransportMode;
    from: Stop;
    to: Stop;
    intermediateStops?: IntermediateStop[] | null;
    route: Route | null;
    trip: Trip | null;
    legGeometry: {
        length: number,
        points: string
    };
}

interface Stop {
    id: string;
    name: string;
    lat: number;
    lon: number;
    stop: {
        id: string;
        gtfsId: string
    } | null;
}

export interface IntermediateStop {
    id: string;
    gtfsId: string;
    name: string;
    lat: number;
    lon: number;
}

interface Route {
    id: string;
    shortName: string | null;
    longName: string | null;
    color: string;
    textColor: string;
}

interface Trip {
    id: string;
    gtfsId: string;
    tripShortName: string | null;
    tripHeadsign: string | null;
}
