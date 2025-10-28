import { Injectable } from "@angular/core";
import * as L from 'leaflet';
import { CircleMarkerDrawOptions, DivIconDrawOptions, PolylineDrawOptions } from "../shared/models/map";

@Injectable({ providedIn: 'root' })
export class MapService {
    tileTheme: { image: string; attribution: string }[] = [
        {
            image: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        {
            image: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }
    ];

    initMap(mapContainerNativeEl: HTMLDivElement) {
        return L.map(mapContainerNativeEl, { center: [47.4979, 19.0402], zoom: 13, zoomControl: false });
    }

    getTile(index: number) {
        return L.tileLayer(
            this.tileTheme[index].image,
            {
                minZoom: -1,
                maxZoom: 20,
                attribution: this.tileTheme[index].attribution,
                updateWhenIdle: true,
                updateWhenZooming: false,
                keepBuffer: 2
            }
        )
    }

    fitBounds(map: L.Map, points: L.LatLngExpression[]) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [10, 10]
        });
    }

    addLayer(map: L.Map) {
        return L.layerGroup().addTo(map);
    }

    removeLayer(map: L.Map, layer: L.LayerGroup | L.TileLayer) {
        map.removeLayer(layer);
    }

    updateMapLabelsVisibility(
        zoom: number = 0,
        query: string[],
        options: Array<Partial<Record<keyof CSSStyleDeclaration, [string, string]>>>
    ) {
        query.forEach((selector: string) => {
            const elements = document.querySelectorAll<HTMLElement>(selector);

            elements.forEach((el) => {
                options.forEach((op) => {
                    (Object.keys(op) as Array<keyof CSSStyleDeclaration>).forEach((cssKey) => {
                        const values = op[cssKey];
                        if (!values) return;

                        const value = zoom < 14 ? values[0] : values[1];
                        el.style.setProperty(cssKey as string, value);
                    });
                });
            });
        });
    }

    drawPolyline({
        points,
        color,
        weight = 3,
        className
    }: PolylineDrawOptions
    ): L.Polyline {
        return L.polyline(points, {
            color,
            className,
            weight
        })
    }

    drawCircleMarker({
        point,
        color,
        fill = false,
        fillOpacity = 1,
        fillColor,
        weight = 2,
        radius = 6
    }: CircleMarkerDrawOptions
    ): L.CircleMarker {
        return L.circleMarker(point, {
            color,
            fill: fill,
            fillOpacity,
            fillColor,
            weight,
            radius
        })
    }

    drawDivIcon({
        type,
        point,
        label,
        color,
        lightColor,
        icon,
        heading,
        status,
        delayedStartTime,
        line,
        className,
        iconAnchor = [0, 0],
        iconSize = undefined
    }: DivIconDrawOptions
    ): L.Marker {
        let divIcon: L.DivIcon;
        const settings = { className, iconAnchor, iconSize };
        const delayClass = status === 'early' ? 'early' : status === 'late' ? 'late' : null;

        if (type === 'transfer') {
            console.log(label + ' ' + status);
        }

        /* const delayClass = () => {
            return status !== null && status !== undefined ? status : ''
        }; */
        // console.log(delayClass);

        switch (type) {
            case 'transport':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div class="dark-map-label name ${lightColor ? 'light' : ''}" style="color: ${color}">${label}</div>
                        <i class="${icon}"></i>

                        <!--div class="status">
                            <i class="fa-fw fa-solid fa-rotate"></i>
                            <span>${status}</span>
                        </!--div-->
                        
                        <div class="direction-container -translate-x-1/2" style="transform: rotate(${heading}deg)">
                            <div class="inner-circle" style="border-color: ${color}"></div>
                            <div class="arrow" style="background: ${color}"></div>
                        </div>
                    `
                });
                break;
            case 'stop':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div class="dark-map-label ${lightColor ? 'light' : ''}">
                            <div style="color: ${color}">${label}</div>
                        </div>
                    `
                });
                break;
            case 'transfer':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div class="dark-map-label ${lightColor ? 'light' : ''}">
                            <div style="color: ${color}">${label}</div>
                            <div class="flex gap-x-4 justify-between">
                                <div class="flex gap-x-1 items-center">
                                    <i class="${icon}"></i>
                                    ${line ? `
                                        <div style="color: ${color}">${line}</div>
                                    ` : ''}
                                </div>
                                ${status ? `
                                <div class="flex gap-x-1 items-center start-time ${status}">
                                    <i class="fa-fw fa-solid fa-clock"></i>
                                    <span>${delayedStartTime}</span>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    `
                });
                break;
            case 'location':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <i class="fa-solid fa-location-arrow text-red-600 text-[24px]"
                            style="transform: rotate(${heading}deg)">
                        </i>
                    `
                });
                break;
            default:
                console.warn(`drawDivIcon: unhandled type '${type}'`);
                divIcon = L.divIcon({
                    html: `
                        <div class=" dark-map-label inline-block p-2 rounded-sm bg-red-800">
                            DrawIcon case is missing
                        </div>
                    `
                });
                break;
        }
        return L.marker(point, { icon: divIcon, });
    }
}