import { DateTime } from "luxon";
import { DelayStatus, PointGeometry } from "./common";

export interface CurrentTrip {
    gtfsId: string;
    alerts: Alert[];
    services: {
        bikesAllowed: {label: string, icon: string, color: string},
        wheelchairAccessible: {label: string, icon: string, color: string},
        info: ServiceInfo[]
    }
    tripShortName: string | null | undefined;
    allStops: StopTime[];
    transportInfo: null | {
        transportId: string | null,
        lastUpdated: number | null,
        mode: string,
        position: {
            heading: number | null | undefined,
            geometry: PointGeometry,
        };
        station: {
            gtfsId?: string | null,
            name?: string | null,
        };
        trip: {
            tripId?: string | null,
            tripShortName?: string | null,
        };
        vehicle: {
            name: string,
            shortName: string,
            textColor: string,
            backgroundColor: string,
            speed: string,
            status: StopStatus,
        };
        isFinished: boolean
    };
}

export interface StopTime {
    arrivalDelay: number | null,
    departureDelay: number | null,
    realtime: boolean,
    realtimeArrival: number,
    realtimeDeparture: number,
    realtimeState: string,
    scheduledArrival: number,
    scheduledDeparture: number,
    serviceDay: number,
    station: {
        // alerts: any[];      // TODO Alert[];
        geometries?: PointGeometry,
        name: string,
        platformCode?: string | null,
        gtfsId: string,
        isPassed: boolean;
        isArrived: boolean;
        tripStop: boolean;
    };
    delay?: {
        scheduledStartTime: string,
        delayedStartTime: string,
        delayedDateTime: DateTime,
        departureDelay: number,
        status: DelayStatus
    }
}

interface Alert {
    text: string;
    severityLevel: AlertSeverityLevel;
    startDate: string;
    endDate: string | null;
    endProgress: number | null;
}

interface ServiceInfo {
    index: number,
    name: string;
    icon: string;
    color: string;
    fromStopName: string;
    tillStopName: string;
}

export type AlertSeverityLevel = 'INFO' | 'WARNING' | 'SEVERE' | 'UNKNOWN_SEVERITY';
export type StopStatus = 'STOPPED_AT' | 'IN_TRANSIT_TO' | 'UNKNOWN';
// export type BikesAllowed = 'NOT_ALLOWED' | 'ALLOWED' | 'UNKNOWN';
// export type WheelchairAccessible = 'NOT_POSSIBLE' | 'POSSIBLE' | 'UNKNOWN';
export type ServiceStatusKey = 'NOT_ALLOWED' | 'ALLOWED' | 'NOT_POSSIBLE' | 'POSSIBLE' | 'UNKNOWN';