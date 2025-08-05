import { PointGeometry, TransportMode } from "../common";

export interface PlaceApiResponse {
    type: 'FeatureCollection';
    features: PlaceFeature[];
}

export interface PlaceFeature {
    type: 'Feature';
    id: string;
    geometry: PointGeometry;
    properties: PlaceFeatureProperties;
}

interface PlaceFeatureProperties {
    code: string;
    modes: TransportMode[];
    name: string;
    score: number;
    type: string;
}