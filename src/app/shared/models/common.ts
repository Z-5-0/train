import { Place } from "./place";

export type TransportMode =
    "COACH"                   // távolsági busz
    | "TRAM"                  // villamos
    | "BUS"                   // helyi busz
    | "TROLLEYBUS"            // troli
    | "SUBURBAN_RAILWAY"      // hév
    | "RAIL_REPLACEMENT_BUS"  // vonatpótló
    | "TRAMTRAIN"             // villamos-vonat hibrid
    | "RAIL"                  // vonat
    | "SUBWAY"                // metró
    | "FERRY"                 // hajó
    | "WALK"                  // gyalog
    | "GPS"                   // 
    | "ERROR"                 // 

export type DelayStatus = 'on time' | 'late' | 'early' | null;

export type ModeData = {
    name: string;
    label: string;
    icon: string;
    color: string;
    lightColor: boolean
}

export interface SelectableRoute {
    originPlace: Place | null;
    destinationPlace: Place | null;
}

export interface PointGeometry {
    type: 'Point';
    coordinates: [number, number];
}

export interface MultiPointGeometry {
    type: 'MultiPoint';
    coordinates: [number, number][];
}

export interface LineStringGeometry {
    type: 'LineString';
    coordinates: [number, number][];
}

export interface MultiLineStringGeometry {
    type: 'MultiLineString';
    coordinates: [number, number][][];
}

export interface PolygonGeometry {
    type: 'Polygon';
    coordinates: [number, number][][];
}

export interface MultiPolygonGeometry {
    type: 'MultiPolygon';
    coordinates: [number, number][][][];
}

export interface GeometryCollection {
    type: 'GeometryCollection';
    geometries: Geometry[];
}

export interface MapTransportData {
    vehicleId: string;
    label: string | null;
    heading: number | null;
    speed: number | null;
    mode: TransportMode;
    modeData: ModeData;
    geometry: PointGeometry,
    tripGeometry: L.LatLngExpression[];
}

type Geometry =
    | PointGeometry
    | MultiPointGeometry
    | LineStringGeometry
    | MultiLineStringGeometry
    | PolygonGeometry
    | MultiPolygonGeometry
    | GeometryCollection;