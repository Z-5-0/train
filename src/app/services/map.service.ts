import { Injectable } from "@angular/core";
import * as L from 'leaflet';
import { CircleMarkerDrawOptions, DivIconDrawOptions, DivIconDrawOptionsData, PolylineDrawOptions } from "../shared/models/map";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { MapTransportData, TransportMode } from "../shared/models/common";

@Injectable({ providedIn: 'root' })
export class MapService {
    private transportMarkersFree = new Map<string, L.Marker>();
    private transportMarkersTrip = new Map<string, L.Marker>();

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

    updateTransportLayer(
        layerGroup: L.LayerGroup,
        transportLocations: MapTransportData[] | null,
        options: { type: 'FREE' | 'TRIP' }
    ): L.LayerGroup<L.Marker> | null {
        if (!layerGroup || !transportLocations) return null;

        const markersMap = options?.type === 'TRIP'
            ? this.transportMarkersTrip
            : this.transportMarkersFree;

        const layerGroupIsEmpty = Object.keys((layerGroup as any)._layers).length === 0;

        transportLocations.forEach(vehicle => {
            const id = vehicle.vehicleId;
            const latlng: L.LatLngExpression = [
                vehicle.geometry.coordinates[0],
                vehicle.geometry.coordinates[1]
            ];

            const markerExists = markersMap.has(id);

            if (markerExists && !layerGroupIsEmpty) {
                const marker = markersMap.get(id)!;
                this.animateMarker(marker, latlng, 500);
                marker.setIcon(this.createTransportMarker(latlng, vehicle).getIcon());
            } else {
                const marker = this.createTransportMarker(latlng, vehicle).addTo(layerGroup);
                markersMap.set(id, marker);
            }
        });

        if (options?.type === 'FREE') {
            markersMap.forEach((marker, id) => {
                if (!transportLocations.find(v => v.vehicleId === id)) {
                    layerGroup.removeLayer(marker);
                    markersMap.delete(id);
                }
            });
        }

        return layerGroup;
    }

    updateTransportLayerPlus(layerGroup: L.LayerGroup, transportLocations: MapTransportData[] | null): L.LayerGroup<L.Marker> | null {
        if (!layerGroup) return null;
        if (!transportLocations) return null;

        layerGroup.clearLayers();

        transportLocations.forEach((vehicle: MapTransportData) => {
            layerGroup.addLayer(this.drawDivIcon(
                {
                    type: 'transport',
                    point: [vehicle.geometry.coordinates[0], vehicle.geometry.coordinates[1]],
                    label: { name: vehicle.label },
                    color: { textColor: vehicle.modeData.color, lightTextColor: TRANSPORT_MODE[vehicle.mode as TransportMode].lightColor },
                    icon: { class: TRANSPORT_MODE[vehicle.mode as TransportMode].icon, heading: vehicle.heading || null },
                    containerClass: 'map-vehicle-label',
                    iconAnchor: [12, 13],
                    iconSize: [24, 26]
                }
            ));
        });

        return layerGroup;
    }

    createTransportMarker(latlng: L.LatLngExpression, vehicle: MapTransportData) {
        return this.drawDivIcon({
            type: 'transport',
            point: latlng,
            label: { name: vehicle.label },
            color: {
                textColor: vehicle.modeData.color,
                lightTextColor: TRANSPORT_MODE[vehicle.mode as TransportMode].lightColor
            },
            icon: {
                class: TRANSPORT_MODE[vehicle.mode as TransportMode].icon,
                heading: vehicle.heading || null
            },
            containerClass: 'map-vehicle-label',
            iconAnchor: [12, 13],
            iconSize: [24, 26]
        })
    }

    animateMarker(marker: L.Marker, toLatLng: L.LatLngExpression, duration = 500) {
        const from = marker.getLatLng();
        const to = L.latLng(toLatLng);
        const start = performance.now();

        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            const lat = from.lat + (to.lat - from.lat) * t;
            const lng = from.lng + (to.lng - from.lng) * t;
            marker.setLatLng([lat, lng]);

            if (t < 1) requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    }

    clearFreeMapMarkers() {
        this.transportMarkersFree.clear();
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

    updateLocationMarker(
        map: L.Map,
        marker: L.Marker | null,
        pos: { lat: number; lng: number; heading: number }
    ): L.Marker {
        const icon = this.drawDivIcon(
            {
                type: 'location',
                point: [pos.lat, pos.lng],
                icon: { class: 'fa-fw fa-solid fa-location-arrow', heading: pos.heading, },
                containerClass: 'text-red-600 text-[24px] user-location',
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
        interactive = false
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
                        <div>
                            <i class="${icon?.class}" ${icon?.heading ? `style="transform: rotate(${icon.heading}deg);"` : ''}></i>
                        </div>
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