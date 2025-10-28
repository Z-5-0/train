import { inject, Injectable } from "@angular/core";
import * as L from 'leaflet';
import { IntermediateStop, RoutePathSequence } from "../shared/models/path";
import { TransportLocation } from "../shared/models/transport-location";
import { MapService } from "./map.service";
import { GeolocationService } from "./geolocation.service";
import { Observable } from "rxjs";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { TransportMode } from "../shared/models/common";

@Injectable({ providedIn: 'root' })
export class MapTripService {
    private mapService: MapService = inject(MapService);

    private transportMode = TRANSPORT_MODE;

    createTripLayers(layerGroup: L.LayerGroup, sequences: RoutePathSequence[]) {
        layerGroup.clearLayers();

        sequences
            .forEach((seq: RoutePathSequence, index: number) => {
                layerGroup.addLayer(this.mapService.drawPolyline(
                    {
                        points: seq.sequenceGeometry.points,
                        color: seq.modeData.color,
                        className: 'map-trip-polyline'
                    }
                ));
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
                layerGroup.addLayer(this.mapService.drawDivIcon(
                    {
                        type: 'transfer',
                        point: [seq.from.lat, seq.from.lon],
                        label: seq.from.name,
                        icon: seq.modeData.icon,
                        color: seq.modeData.color,
                        lightColor: TRANSPORT_MODE[seq.mode].lightColor,
                        status: seq.status,
                        delayedStartTime: seq.delayedStartTime,
                        line: seq.route ? seq.route[(seq.modeData.name as 'longName' | 'shortName')] : null,
                        className: 'map-stop-label'
                    }
                ));

                // if (!seq.intermediateStops?.length) return;

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

    updateOriginsLayer(layerGroup: L.LayerGroup | null, sequence: RoutePathSequence) {
        if (!layerGroup) return;

        layerGroup.clearLayers();

        layerGroup.addLayer(this.mapService.drawDivIcon(
            {
                type: 'transfer',
                point: [sequence.from.lat, sequence.from.lon],
                label: sequence.from.name,
                icon: sequence.modeData.icon,
                color: sequence.modeData.color,
                lightColor: TRANSPORT_MODE[sequence.mode].lightColor,
                status: sequence.status,
                delayedStartTime: sequence.delayedStartTime,
                className: 'map-stop-label',
            }
        ));
        return layerGroup;
    }

    updateTransportLayer(layerGroup: L.LayerGroup, transportLocations: TransportLocation | null): L.LayerGroup<L.Marker> | null {
        if (!layerGroup) return null;
        if (!transportLocations) return null;

        layerGroup.clearLayers();

        transportLocations.forEach((vehicle: TransportLocation[number]) => {
            layerGroup.addLayer(this.mapService.drawDivIcon(
                {
                    type: 'transport',
                    point: vehicle.point as [number, number],
                    label: vehicle.label,
                    color: vehicle.modeData.color,
                    lightColor: TRANSPORT_MODE[vehicle.mode].lightColor,
                    icon: this.transportMode[vehicle.mode].icon,
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
                type: 'location',
                point: [pos.lat, pos.lng],
                icon: 'fa-fw fa-solid fa-location-arrow',
                heading: pos.heading,
                className: 'user-location',
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

    /* updateLocationMarker(marker: L.Marker | null, pos: any) {     // TODO
        if (!marker) marker = L.marker([pos.lat, pos.lng]);
        if (marker) marker.removeFrom;

        this.mapService.drawDivIcon(
            'location',
            [pos.lat, pos.lng],
            '',
            '',
            pos.heading,
            null,
            '',
            'user-location',
            'fa-fw fa-solid fa-location-arrow',
            [12, 12],
            [24, 24]
        );

        // return L.marker([pos.lat, pos.lng], { icon: userIcon }).addTo(map)
        return marker;
    } */
}