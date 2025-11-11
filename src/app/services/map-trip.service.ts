import { inject, Injectable } from "@angular/core";
import { IntermediateStop, RoutePathSequence } from "../shared/models/path";
import { MapService } from "./map.service";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { TransportMode } from "../shared/models/common";
import { RealtimeTripPathOriginData, RealtimeTripPathTransportData } from "../shared/models/realtime-trip-path";

@Injectable({ providedIn: 'root' })
export class MapTripService {
    private mapService: MapService = inject(MapService);

    createTripLayers(layerGroup: L.LayerGroup, sequences: RoutePathSequence[]) {
        layerGroup.clearLayers();

        sequences
            .forEach((seq: RoutePathSequence, index: number) => {
                if (index === 0) {
                    layerGroup.addLayer(this.mapService.drawDivIcon({
                        type: 'icon',
                        point: [seq.from.lat, seq.from.lon],
                        icon: 'fa-fw fa-solid fa-map-marker-alt text-[24px] text-emerald-500',
                        color: '#00ff00',
                        className: 'start-icon',
                        iconAnchor: [12, 24],
                        iconSize: [24, 24],
                    }));
                }
                if (index === sequences.length - 1) {
                    layerGroup.addLayer(this.mapService.drawDivIcon({
                        type: 'icon',
                        point: [seq.to.lat, seq.to.lon],
                        icon: 'fa-fw fa-solid fa-flag-checkered text-[24px] text-rose-500',
                        color: '#ff0000',
                        className: 'destination-icon',
                        iconAnchor: [12, 24],
                        iconSize: [24, 24],
                    }));
                }
                if (index !== 0 && index !== sequences.length - 1) {
                    layerGroup.addLayer(this.mapService.drawCircleMarker(
                        {
                            point: [seq.from.lat, seq.from.lon],
                            color: '#000000',
                        }
                    ));
                    layerGroup.addLayer(this.mapService.drawCircleMarker(
                        {
                            point: [seq.to.lat, seq.to.lon],
                            color: '#000000',
                        }
                    ));
                }

                layerGroup.addLayer(this.mapService.drawPolyline(
                    {
                        points: seq.sequenceGeometry.points,
                        color: seq.modeData.color,
                        className: 'map-trip-polyline'
                    }
                ));

                seq.intermediateStops?.forEach((stop: IntermediateStop) => {
                    layerGroup.addLayer(this.mapService.drawDivIcon(
                        {
                            type: 'stop',
                            point: [stop.geometry.coordinates[0], stop.geometry.coordinates[1]],
                            label: stop.name,
                            color: seq.modeData.color,
                            lightColor: TRANSPORT_MODE[seq.mode].lightColor,
                            className: 'map-stop-label',
                        }
                    ));
                    layerGroup.addLayer(this.mapService.drawCircleMarker(
                        {
                            point: [stop.geometry.coordinates[0], stop.geometry.coordinates[1]],
                            color: seq.modeData.color,
                            fill: true,
                            weight: 1,
                            radius: 3
                        }
                    ));
                });

                if (index !== (sequences.length - 1)) return;

                layerGroup.addLayer(this.mapService.drawDivIcon({
                    type: 'stop',
                    point: [seq.to.lat, seq.to.lon],
                    label: seq.to.name,
                    color: seq.modeData.color,
                    lightColor: TRANSPORT_MODE[seq.mode].lightColor,
                    className: 'map-stop-label',
                }));
            });

        return layerGroup;
    }

    updateTripOriginsLayer(layerGroup: L.LayerGroup | null, sequences: RealtimeTripPathOriginData[]) {
        if (!layerGroup) return null;

        layerGroup.clearLayers();

        sequences
            .forEach((origin: RealtimeTripPathOriginData) => {
                layerGroup.addLayer(this.mapService.drawDivIcon(
                    {
                        type: 'transfer',
                        point: [origin.lat, origin.lon],
                        label: origin.label,
                        icon: origin.modeData.icon,
                        color: origin.modeData.color,
                        lightColor: TRANSPORT_MODE[origin.mode].lightColor,
                        status: origin.status,
                        delayedStartTime: origin.delayedStartTime,
                        transportName: origin.transportName,
                        className: 'map-stop-label',
                        iconAnchor: [0, 0]
                    }
                ));
            });
        return layerGroup;
    }

    updateTransportLayer(layerGroup: L.LayerGroup, transportLocations: RealtimeTripPathTransportData[] | null): L.LayerGroup<L.Marker> | null {
        if (!layerGroup) return null;
        if (!transportLocations) return null;

        layerGroup.clearLayers();

        transportLocations.forEach((vehicle: RealtimeTripPathTransportData) => {
            layerGroup.addLayer(this.mapService.drawDivIcon(
                {
                    type: 'transport',
                    point: [vehicle.lat, vehicle.lon],
                    label: vehicle.label,
                    color: vehicle.modeData.color,
                    lightColor: TRANSPORT_MODE[vehicle.mode as TransportMode].lightColor,
                    icon: TRANSPORT_MODE[vehicle.mode as TransportMode].icon,
                    heading: vehicle.heading,
                    className: 'map-vehicle-label',
                    iconAnchor: [12, 13],
                    iconSize: [24, 26]
                }
            ));
        });

        return layerGroup;
    }

    updateLocationMarker(map: L.Map, marker: L.Marker | null, pos: { lat: number; lng: number; heading: number }): L.Marker {
        const icon = this.mapService.drawDivIcon(
            {
                type: 'icon',
                point: [pos.lat, pos.lng],
                icon: 'fa-fw fa-solid fa-location-arrow',
                heading: pos.heading,
                className: 'text-red-600 text-[24px] user-location',
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
}