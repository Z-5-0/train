import { DelayStatus } from "./common";

export type MapMode = 'FREE' | 'TRIP';

export interface ActiveMap {
    id: string;
    mode: MapMode;
}

export interface PolylineDrawOptions {
    points: L.LatLngExpression[];
    color: string;
    weight?: number;
    className: string;
    interactive?: boolean;
}

export interface CircleMarkerDrawOptions {
    point: L.LatLngExpression;
    color?: string;
    fill?: boolean;
    fillOpacity?: number;
    fillColor?: string;
    weight?: number;
    radius?: number;
    interactive?: boolean;
}

export interface DivIconDrawOptions {
    type: 'transport' | 'stop' | 'transfer' | 'location' | 'icon';
    point: L.LatLngExpression;
    label?: DivIconDrawOptionsLabel;
    color?: {
        textColor: string,
        lightTextColor?: boolean | null
    };
    icon?: {
        class: string,
        color?: string,
        heading?: number | null
    };
    data?: DivIconDrawOptionsData[];
    containerClass: string;
    iconAnchor?: [number, number];
    iconSize?: [number, number] | undefined;
    interactive?: boolean
}

interface DivIconDrawOptionsLabel {
    name: string | null;
    description?: {
        text: string;
        color?: string
    };
    preIcon?: DivIconDrawOptionsColoredIcon,
    postIcon?: DivIconDrawOptionsColoredIcon,
}

export interface DivIconDrawOptionsData {
    label: DivIconDrawOptionsDataLabel,
    class?: string,
    status?: DelayStatus,
    time?: string | null,
    track?: any     // TODO TYPE
}

interface DivIconDrawOptionsDataLabel {
    name: string | null,
    color?: {
        textColor?: string,
        lightTextColor?: boolean
    },
    preIcon?: DivIconDrawOptionsColoredIcon,
    postIcon?: DivIconDrawOptionsColoredIcon
}

interface DivIconDrawOptionsColoredIcon {
    class: string;
    color?: string
}

export interface TripMapState {
    center: { lat: number; lng: number };
    zoom: number;
}

export interface CommonMapLayers {
    userLocation: L.Marker | null;
}

export interface FreeMapLayers {
    vehicles: L.LayerGroup;
    routePreview: L.LayerGroup;
    // ...
}

export interface TripMapLayers {
    route: L.FeatureGroup;
    stops: {
        intermediate: L.LayerGroup;
        boarding: L.LayerGroup;
    };
    vehicles: L.LayerGroup;
    routePreview: L.LayerGroup;
}

export interface MapLabelRule {
    selector: string;
    minZoom: number;
    styles: Partial<Record<keyof CSSStyleDeclaration, [string, string]>>;
}

export interface TripPreviewLayerOptions extends L.LayerOptions {
    tripGtfsId?: string;
}