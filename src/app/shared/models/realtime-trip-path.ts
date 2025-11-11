import { DelayStatus, PointGeometry, TransportMode } from "./common";

export type RealtimeTripPath = {
    originData: RealtimeTripPathOriginData[];
    transportData: RealtimeTripPathTransportData[];
} | null;

export interface RealtimeTripPathOriginData {
    label: string | null;
    transportName: string | null;
    mode: TransportMode;
    modeData: {
        name: string;
        label: string;
        icon: string;
        color: string
    };
    scheduledStartTime: string | null;
    delayedStartTime: string | null;
    departureDelay: number | null;
    status: DelayStatus | null;
    lat: number;
    lon: number;
}

export interface RealtimeTripPathTransportData {
    label: string | null;
    heading: number;
    speed: number;
    mode: TransportMode;
    modeData: {
        name: string;
        label: string;
        icon: string;
        color: string;
    };
    lat: number;
    lon: number;
    tripGeometry: L.LatLngExpression[];
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
    stoptimes: ExtendedVehiclePositionStoptimes[]
}

interface ExtendedVehiclePositionStoptimes {
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
}


