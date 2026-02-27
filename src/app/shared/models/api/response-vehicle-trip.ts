import { GraphQLResponseError, PointGeometry } from "../common";

export interface VehicleTripResponse {
    data: {
        trip: VehicleTripResponseData,
    };
    errors?: GraphQLResponseError[];
}

export interface VehicleTripResponseData {
    id: string;
    gtfsId: string;
    stoptimes: VehicleTripStoptime[];
}

export interface VehicleTripStoptime {
    realtime: true
    arrivalDelay: number;
    departureDelay: number;
    realtimeArrival: number;
    realtimeDeparture: number;
    scheduledArrival: number;
    scheduledDeparture: number;
    serviceDay: number;
    stop: VehicleTripStop;
}

interface VehicleTripStop {
    geometries: {
        geoJson: PointGeometry,
    }
    gtfsId: string;
    lat: number;
    lon: number;
    name: string;
}