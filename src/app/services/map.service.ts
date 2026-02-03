import { Injectable } from "@angular/core";
import * as L from 'leaflet';
import { CircleMarkerDrawOptions, DivIconDrawOptions, DivIconDrawOptionsData, MapLabelRule, PolylineDrawOptions } from "../shared/models/map";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { MapTransportData, TransportMode } from "../shared/models/common";
import polyline from '@mapbox/polyline';


@Injectable({ providedIn: 'root' })
export class MapService {


    tileTheme: { image: string; attribution: string }[] = [
        {
            image: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        {
            image: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
    ];

    initMap(container: HTMLDivElement) {
        const options: L.MapOptions = {
            center: L.latLng(47.4979, 19.0402),
            zoom: 13,
            zoomControl: false
        };

        return L.map(container, options);
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
        currentZoom: number,
        rules: MapLabelRule[]
    ) {
        rules.forEach(rule => {
            const active = currentZoom >= rule.minZoom;
            const elements = document.querySelectorAll<HTMLElement>(rule.selector);

            elements.forEach(el => {
                Object.entries(rule.styles).forEach(([cssKey, values]) => {
                    if (!values) return;
                    el.style.setProperty(cssKey, active ? values[1] : values[0]);
                });
            });
        });
    }

    updateLocationMarker(
        map: L.Map,
        marker: L.Marker | null,
        pos: { lat: number; lng: number; heading: number }
    ): L.Marker {
        const icon = this.drawDivIcon(
            {
                type: 'location',
                point: [pos.lat, pos.lng],
                icon: { class: 'fa-fw fa-solid fa-location-arrow text-[24px]', heading: pos.heading, },
                containerClass: '!flex text-red-600 user-location',
                iconAnchor: [12, 12],
                iconSize: [24, 24]
            }
        )
        if (marker) {
            marker.setLatLng([pos.lat, pos.lng]);
            marker.setIcon(icon.getIcon());
            return marker;
        }

        return icon.addTo(map);
    }

    drawPolyline({
        points,
        color,
        weight = 3,
        className,
        interactive = false
    }: PolylineDrawOptions
    ): L.Polyline {
        return L.polyline(points, {
            color,
            className,
            weight,
            interactive
        })
    }

    drawCircleMarker({
        point,
        color,
        fill = false,
        fillOpacity = 1,
        fillColor,
        weight = 2,
        radius = 6,
        interactive = false
    }: CircleMarkerDrawOptions
    ): L.CircleMarker {
        return L.circleMarker(point, {
            color,
            fill: fill,
            fillOpacity,
            fillColor,
            weight,
            radius,
            interactive
        })
    }

    drawDivIcon({
        type,
        point,
        label,
        color,
        icon,
        data,
        containerClass,
        iconAnchor = [0, 0],
        iconSize = undefined,
        interactive = true     // TODO false
    }: DivIconDrawOptions
    ): L.Marker {
        let divIcon: L.DivIcon;
        const settings = { className: containerClass, iconAnchor, iconSize };

        switch (type) {
            case 'transport':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div class="dark-map-label name ${color?.lightTextColor ? 'light' : ''}" style="color: ${color?.textColor}">${label?.name}</div>
                        <i class="${icon?.class}"></i>

                        <div class="direction-container -translate-x-1/2" style="transform: rotate(${icon?.heading}deg)">
                            <div class="inner-circle" style="border-color: ${color?.textColor}"></div>
                            <div class="arrow" style="background: ${color?.textColor}"></div>
                        </div>
                    `
                });
                break;
            case 'stop':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div class="dark-map-label ${color?.lightTextColor ? 'light' : ''}">
                            <div style="color: ${color?.textColor}">${label?.name}</div>
                        </div>
                    `
                });
                break;
            case 'transfer':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
        <div class="dark-map-label ${color?.lightTextColor ? 'light' : ''}">
            <div class="" style="color: ${color?.textColor}">
                <span>${label?.name ?? ''}</span>
            </div>
            <div class="grid grid-cols-[1fr_1fr_1fr] gap-x-4 items-center justify-between">
                    ${data?.map((d: DivIconDrawOptionsData, index: number) => `
                    <div class="${d.class ?? ''}">
                        <div class="data ${d.label.color?.lightTextColor ? 'lightText' : 'darkText'}" style="color: ${d.label.color?.textColor}">
                            ${d.label.preIcon
                            ? `<i class="${d.label.preIcon.class}" style="color: ${d.label.preIcon.color ?? ''}"></i>`
                            : ''}

                                ${d.label
                            ? `<span style="color: ${d.label.color?.textColor ?? ''}">${d.label.name ?? ''}</span>`
                            : ''}

                            ${d.label.postIcon
                            ? `<i class="${d.label.postIcon.class}" style="color: ${d.label.postIcon.color ?? ''}"></i>`
                            : ''}
                        </div>
                        ${d.time ? `<span class="${d.status === 'early' ? 'text-[var(--color-warning)]' :
                            d.status === 'on time' ? 'text-[var(--color-success)]' :
                                d.status === 'late' ? 'text-[var(--color-error)]' : ''
                            }" style="text-shadow: 1px 1px 2px var(--color-black)">${d.time}</span>` : ''}
                    </div>
                    ${index === 0 ? `
                        <div class="justify-self-center">
                            ${data[0].label.preIcon?.class && data[1].label.postIcon?.class
                                ? `
                                <i class="fa-solid fa-angle-right text-[20px]"></i>`
                                : ''}
                        </div>
                    ` : ''}
            `).join('')}
            </div>
        </div>
    `
                });
                break;
            case 'location':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <i class="${icon?.class}" ${icon?.heading ? `style="transform: rotate(${icon.heading}deg);"` : ''}></i>
                    `
                });
                break;
            case 'icon':
                divIcon = L.divIcon({
                    ...settings,
                    html: `
                        <div>
                            <i class="${icon?.class}"></i>
                        </div>
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
        return L.marker(point, { icon: divIcon, interactive });
    }
}