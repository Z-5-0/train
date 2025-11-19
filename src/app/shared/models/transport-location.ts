import { ModeData, TransportMode } from "./common";

export type TransportLocation = {
    gtfsId: string;
    heading: number;
    id: string;
    label: string;
    lastUpdated: string;
    mode: TransportMode;
    modeData: ModeData;
    point: L.LatLngExpression; 
}[];