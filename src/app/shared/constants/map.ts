import { MapMode } from "../models/map";

export type MapModeHandler = () => void;

export const MapModeAction: Record<MapMode, MapModeHandler> = {
    TRIP: () => { },
    FREE: () => { }
};