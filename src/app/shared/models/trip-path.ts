import { DelayStatus, MapTransportData, ModeData, PointGeometry, TransportMode } from "./common";

export type TripPath = {
    originData: TripPathOriginData[];
    transportData: MapTransportData[];
} | null;

export interface TripPathOriginData {
    label: string | null;
    arrivingTransportData: TripPathOriginTransportData | null;
    leavingTransportData: TripPathOriginTransportData | null;
    geometry: PointGeometry | null
}

export interface TripPathOriginTransportData {
    transportName: string | null;
    status: string | null;

    scheduledStartTime?: string | null;
    delayedStartTime?: string | null;
    departureDelay?: number | null;

    scheduledEndTime?: string | null;
    delayedEndTime?: string | null;
    arrivalDelay?: number | null;

    isPassed: boolean;
    mode: string;
    modeData: ModeData | null;
}

export interface ExtendedVehiclePosition {
    vehicleId: string;
    lat: number;
    lon: number;
    heading: number;
    speed: number;
    lastUpdated: number;
    trip: {
        route: {
            shortName: string | null,
            longName: string | null,
            mode: TransportMode
        }
    },
    tripGeometry: {
        length: number,
        points: string,
    },
    // stoptimes: ExtendedVehiclePositionStoptimes[]       // TODO DELETE
}

/* interface ExtendedVehiclePositionStoptimes {
    scheduledArrival: number;
    realtimeArrival: number;
    arrivalDelay: number;
    scheduledDeparture: number;
    realtimeDeparture: number;
    departureDelay: number;
    realtime: boolean;
    serviceDay: number;
    stop: {
        gtfsId: string,
        name: string,
        lat: number,
        lon: number,
        geometries: {
            geoJson: PointGeometry
        }
    }
} */

export type ArrivalInfo = {
    scheduledEndTime: string | null;
    delayedEndTime: string | null;
    arrivalDelay: number | null;
    status: DelayStatus | null;
};

export type DepartureInfo = {
    scheduledStartTime: string | null;
    delayedStartTime: string | null;
    departureDelay: number | null;
    status: DelayStatus | null;
};




