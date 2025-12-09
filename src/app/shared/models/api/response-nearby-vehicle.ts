import { TransportMode } from "../common";

export interface NearbyVehicleResponse {
    data: {
        vehiclePositions: VehiclePosition[];
    };
}

interface VehiclePosition {
    vehicleId: string;
    lat: number;
    lon: number;
    heading: number | null;
    label: string | null;
    lastUpdated: number;
    speed: number | null;
    prevOrCurrentStop: PrevOrCurrentStop;
    stopRelationship: StopRelationship;
    trip: Trip;
    routeShortName: string | null;
    tripGeometry: TripGeometry;
    tripHeadsign: string | null;
    tripShortName: string | null;
    vehicleModel: string | null;
}

interface PrevOrCurrentStop {
    scheduledArrival: number;
    realtimeArrival: number;
    arrivalDelay: number;
    scheduledDeparture: number;
    realtimeDeparture: number;
    departureDelay: number;
}

interface StopRelationship {
    status: string;
    stop: Stop;
    arrivalTime: number;
    departureTime: number;
}

interface Stop {
    gtfsId: string;
    name: string;
}

interface Trip {
    id: string;
    gtfsId: string;

    routeShortName: string | null;
    pattern: TripPattern;
    route: Route;
}

interface TripPattern {
    id: string;
}

interface Route {
    mode: TransportMode;
    shortName: string | null;
    longName: string | null;
    textColor: string | null;
    color: string | null;
}

interface TripGeometry {
    length: number;
    points: string;
}