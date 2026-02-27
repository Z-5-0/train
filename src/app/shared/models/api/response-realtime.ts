import { GraphQLResponseError, PointGeometry, TransportMode } from "../common";

export interface RealtimeTripResponse {
    data: Record<string, RealtimeTripData | null> | null;
    errors?: GraphQLResponseError[];
}

export interface RealtimeTripData {
    id: string;
    stoptimes: RealtimeStoptime[];
    tripGeometry: RealtimeTripGeometry;
    vehiclePositions: RealtimeVehiclePosition[];
    route: RealtimeTripDataRoute;
}

export interface RealtimeTripDataRoute {
    shortName: string | null;
    longName: string | null;
    mode: string;
    color: string | null;
    textColor: string | null;
}

interface RealtimeTripGeometry {
    length: number;
    points: string;
}

export interface RealtimeVehiclePosition {
    vehicleId: string;
    heading: number;
    lastUpdated: number;
    lat: number;
    lon: number
    speed: number;
    trip: {
        id: string,
        route: {
            shortName: string | null;
            longName: string | null;
            mode: TransportMode
        }
    },
    stopRelationship: {
        stop: {
            gtfsId: string,
            name: string
        }
    }
}

export interface RealtimeStoptime {
    realtime: boolean;
    arrivalDelay: number;
    departureDelay: number;
    realtimeArrival: number;
    realtimeDeparture: number;
    scheduledArrival: number;
    scheduledDeparture: number;
    serviceDay: number;     // UNIX timestamp
    stop: RealtimeStopTimeData;
}

interface RealtimeStopTimeData {
    gtfsId: string;
    name: string;
    lat: number;
    lon: number;
    geometries: {
        geoJson: PointGeometry
    }
}