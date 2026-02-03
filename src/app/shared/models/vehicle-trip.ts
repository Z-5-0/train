import { PointGeometry } from "./common";

export interface VehicleTripStop {
    gtfsId: string;
    label: string;
    geometry: PointGeometry
}