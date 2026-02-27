import { GraphQLResponseError, PointGeometry, TransportMode } from "../common";

export interface TripResponse {
    data: { trip: Trip };
    errors?: GraphQLResponseError[];
}

export interface Trip {
    id: string;
    alerts: Alert[];
    bikesAllowed?: BikePolicy;
    blockId?: string | null;
    directionId?: string | null;
    infoServices?: InfoService[];
    isThroughCoach?: boolean;
    pattern: { id: string };
    pullingTrips?: ThroughCoach[];
    route: Route;
    routeBikesAllowed?: BikePolicy;
    serviceDescriptions?: string[];
    serviceId?: string;
    shapeId?: string;
    stoptimes?: StopTime[];
    throughCoaches?: ThroughCoach[];
    tripBikesAllowed?: BikePolicy;
    tripGeometry?: {
        length: number;
        points: string;
    };
    tripHeadsign?: string;
    tripShortName?: string | null;
    vehiclePositions?: VehiclePosition[];
    wheelchairAccessible?: Accessibility;
}

interface Alert {
    id: string;
    alertHash: string;
    alertUrl: string | null;
    alertCause: AlertCause;
    alertEffect: AlertEffect;
    alertHeaderText: string;
    alertSeverityLevel: AlertSeverityLevel;
    alertDescriptionText: string;
    alertUrlTranslations: Translation[];
    alertHeaderTextTranslations: Translation[];
    alertDescriptionTextTranslations: Translation[];
    effectiveStartDate: number;
    effectiveEndDate: number;
    feed: string;
}

interface Translation {
    language: string;
    text: string;
}

interface InfoService {
    name: string;
    fontCode?: number;
    displayable?: boolean;
    fontCharSet?: string;
    fromStopIndex?: number;
    tillStopIndex?: number;
    fromStop?: StopReference;
    tillStop?: StopReference;
}

interface StopReference {
    id: string;
    name: string;
}

interface Route {
    id: string;
    mode: TransportMode;
    alerts?: Alert[];
    agency: Agency;
    shortName?: string;
    longName?: string | null;
    type?: number;
    url?: string | null;
    color?: string;
    textColor?: string;
    bikesAllowed?: BikePolicy;
    patterns?: RoutePattern[];
}

interface Agency {
    id: string;
    name: string;
    url?: string;
    timezone?: string;
    lang?: string;
    phone?: string;
    fareUrl?: string;
}

interface RoutePattern {
    id: string;
    tripsForDate: TripForDate[];
}

interface TripForDate {
    id: string;
    stops: { id: string }[];
}

interface StopTime {
    scheduledArrival: number;
    realtimeArrival: number;
    arrivalDelay: number;
    scheduledDeparture: number;
    realtimeDeparture: number;
    departureDelay: number;
    pickupType: string;
    dropoffType: string;
    timepoint: boolean;
    realtime: boolean;
    realtimeState: string;
    serviceDay: number;
    platformColor?: string;
    stop: Stop;
}

interface Stop {
    timezone: string | null;
    alerts?: Alert[];
    id: string;
    stopId: string;
    platformCode?: string | null;
    code?: string | null;
    name: string;
    lat: number;
    lon: number;
    geometries?: {
        geoJson: PointGeometry;
    };
}

interface ThroughCoach {
    trip: Partial<Trip> & {
        stoptimes?: { stop: { name: string } }[];
        route?: Pick<Route, 'mode' | 'shortName' | 'longName' | 'color' | 'textColor'>;
    };
    attachedFromStop: { name: string };
    attachedTillStop: { name: string };
    serviceDateDayChange: number;
}

interface VehiclePosition {
    stopRelationship: {
        status: StopStatus;
        stop: {
            id: string;
            gtfsId: string;
            name: string;
        };
        arrivalTime: number;
        departureTime: number;
    };
    vehicleId: string;
    lat: number;
    lon: number;
    label: string;
    speed: number;
    heading: number;
    lastUpdated: number;
    trip: {
        tripShortName: string | null;
        gtfsId: string;
    };
}

type BikePolicy = 'ALLOWED' | 'NOT_ALLOWED' | 'NO_INFORMATION';
type Accessibility = 'POSSIBLE' | 'NOT_POSSIBLE' | 'UNKNOWN';
type StopStatus = 'STOPPED_AT' | 'IN_TRANSIT_TO';
type AlertCause =
    | 'UNKNOWN_CAUSE'
    | 'OTHER_CAUSE'
    | 'TECHNICAL_PROBLEM'
    | 'STRIKE'
    | 'DEMONSTRATION'
    | 'ACCIDENT'
    | 'HOLIDAY'
    | 'WEATHER'
    | 'MAINTENANCE'
    | 'CONSTRUCTION'
    | 'POLICE_ACTIVITY'
    | 'MEDICAL_EMERGENCY';
type AlertEffect =
    | 'NO_SERVICE'
    | 'REDUCED_SERVICE'
    | 'SIGNIFICANT_DELAYS'
    | 'DETOUR'
    | 'ADDITIONAL_SERVICE'
    | 'MODIFIED_SERVICE'
    | 'OTHER_EFFECT'
    | 'UNKNOWN_EFFECT'
    | 'STOP_MOVED'
    | 'SHUTTLE_SERVICE';
type AlertSeverityLevel = 'INFO' | 'WARNING' | 'SEVERE';
