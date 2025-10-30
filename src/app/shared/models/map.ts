export type MapMode = 'FREE' | 'TRIP';

export interface ActiveMap {
    id: string;
    mode: MapMode;
}

export interface PolylineDrawOptions {
    points: L.LatLngExpression[];
    color: string;
    weight?: number;
    className: string
}

export interface CircleMarkerDrawOptions {
    point: L.LatLngExpression;
    color?: string;
    fill?: boolean;
    fillOpacity?: number;
    fillColor?: string;
    weight?: number;
    radius?: number;
}

export interface DivIconDrawOptions {
    type: 'transport' | 'stop' | 'transfer' | 'icon';
    point: L.LatLngExpression;
    label?: string;
    color?: string;
    lightColor?: boolean;
    icon?: string;
    heading?: number;
    status?: 'early' | 'late' | 'on time' | null;
    delayedStartTime?: string;
    line?: string | null;
    className?: string;
    html?: string;
    iconAnchor?: [number, number];
    iconSize?: [number, number] | undefined
}