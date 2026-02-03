import { MapLabelRule } from "../models/map";

export const MAP_LABEL_RULES: MapLabelRule[] = [
    { selector: '.map-stop-label', minZoom: 14, styles: { display: ['none', 'grid'] } },
    { selector: '.map-rest-stop-label', minZoom: 14, styles: { display: ['none', 'grid'] } },
    { selector: '.map-vehicle-label .name', minZoom: 14, styles: { display: ['none', 'grid'] } },
    { selector: '.map-vehicle-label .direction-container', minZoom: 14, styles: { display: ['none', 'grid'] } },
];
