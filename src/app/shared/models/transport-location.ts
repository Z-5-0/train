import { ModeData, TransportMode } from "./common";

export type TransportLocation = {
    gtfsId: string;
    heading: number;
    id: string;
    label: string;
    mode: TransportMode;
    modeData: ModeData;
    point: L.LatLngExpression; 
}[];