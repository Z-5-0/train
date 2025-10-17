import { TransportMode } from "./common";

export type TransportLocation = {
    gtfsId: string;
    heading: number;
    id: string;
    label: string;
    lastUpdated: string;
    mode: TransportMode;
    modeData: {
        name: string;
        label: string;
        icon: string;
        color: string;
    };
    point: L.LatLngExpression; 
}[];