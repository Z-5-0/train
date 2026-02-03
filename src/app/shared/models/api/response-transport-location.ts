import { TransportMode } from "../common";

export interface TransportLocationResponse {
    data: VehiclePositionsForTrips;
    errors?: TransportLocationError[];
}

interface VehiclePositionsForTrips {
    vehiclePositionsForTrips: VehiclePosition[] | null;
}

export interface VehiclePosition {
    vehicleId: string;
    heading: number;
    label: string;
    speed: number;
    lat: number;
    lon: number;
    trip: VehiclePositionTrip;
}

interface VehiclePositionTrip {
    gtfsId: string;
    id: string;
    tripHeadsign: string;
    routeShortName: string;
    route: VehiclePositionTripRoute;
    tripGeometry: {
        length: number,
        points: string,
    };
}

interface VehiclePositionTripRoute {
    color: string;
    mode: TransportMode;
    shortName: string;
    longName: string;
}

interface TransportLocationError {
    extensions: {
        classification: string,
    };
    locations: { line: number; column: number }[];
    message: string;
    path: string[];
}