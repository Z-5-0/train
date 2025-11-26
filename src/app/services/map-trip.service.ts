import { inject, Injectable } from "@angular/core";
import { IntermediateStop, RoutePathSequence } from "../shared/models/path";
import { MapService } from "./map.service";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { DelayStatus, TransportMode } from "../shared/models/common";
import { TripPathOriginData, TripPathTransportData } from "../shared/models/trip-path";

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
                        icon: { class: 'fa-fw fa-solid fa-map-marker-alt text-[24px] text-emerald-500' },
                        color: { textColor: '#00ff00' },
                        containerClass: 'start-icon',
                        iconAnchor: [12, 24],
                        iconSize: [24, 24],
                    }));
                }
                if (index === sequences.length - 1) {
                    layerGroup.addLayer(this.mapService.drawDivIcon({
                        type: 'icon',
                        point: [seq.to.lat, seq.to.lon],
                        icon: { class: 'fa-fw fa-solid fa-flag-checkered text-[24px] text-rose-500' },
                        color: { textColor: '#ff0000' },
                        containerClass: 'destination-icon',
                        iconAnchor: [12, 24],
                        iconSize: [24, 24],
                    }));
                }

                console.log('reDraw');
                if (index !== 0 && index !== sequences.length - 1) {
                    layerGroup.addLayer(this.mapService.drawCircleMarker(
                        {
                            point: [seq.from.lat, seq.from.lon],
                            color: '#828282',
                        }
                    ));
                    layerGroup.addLayer(this.mapService.drawCircleMarker(
                        {
                            point: [seq.to.lat, seq.to.lon],
                            color: '#828282',
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
                            label: { name: stop.name },
                            color: { textColor: seq.modeData.color, lightTextColor: TRANSPORT_MODE[seq.mode].lightColor },
                            containerClass: 'map-stop-label',
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

                /* layerGroup.addLayer(this.mapService.drawDivIcon({     // TODO DELETE (comes from originsUpdate)
                    type: 'stop',
                    point: [seq.to.lat, seq.to.lon],
                    label: { name: ' > > > ' + seq.to.name + ' < < < ' },
                    colors: { textColor: seq.modeData.color, lightTextColor: TRANSPORT_MODE[seq.mode].lightColor },
                    containerClass: 'map-stop-label',
                })); */
            });

        return layerGroup;
    }

    updateTripOriginsLayer(layerGroup: L.LayerGroup | null, sequences: TripPathOriginData[]) {
        if (!layerGroup) return null;

        layerGroup.clearLayers();

        sequences
            .forEach((origin: TripPathOriginData) => {
                layerGroup.addLayer(this.mapService.drawDivIcon(
                    {
                        type: 'transfer',
                        point: [origin?.geometry?.coordinates[0] ?? 0, origin?.geometry?.coordinates[1] ?? 0],
                        label: { name: origin.label },
                        color: {
                            textColor: origin.leavingTransportData?.modeData?.color || origin.arrivingTransportData?.modeData?.color || '',
                            lightTextColor: TRANSPORT_MODE[(origin.leavingTransportData?.mode) as TransportMode]?.lightColor ?? TRANSPORT_MODE[(origin.arrivingTransportData?.mode) as TransportMode]?.lightColor ?? null
                        },
                        data: [
                            {
                                label: {        // origin.arrivingTransportData
                                    name: origin.arrivingTransportData?.transportName ?? null,
                                    color: {
                                        textColor: origin.arrivingTransportData?.modeData?.color,
                                        lightTextColor: origin.arrivingTransportData?.modeData?.lightColor
                                    },
                                    preIcon: {
                                        class: origin.arrivingTransportData?.modeData?.icon ?? '',
                                        color: origin.arrivingTransportData?.modeData?.color
                                    },
                                    // postIcon?: DivIconDrawOptionsColoredIcon
                                },
                                time: origin.arrivingTransportData?.delayedEndTime ?? null,
                                status: (origin.arrivingTransportData?.status ?? null) as DelayStatus,
                                class: 'grid',
                            },
                            {
                                label: {        // origin.leavingTransportData
                                    name: origin.leavingTransportData?.transportName ?? null,
                                    color: {
                                        textColor: origin.leavingTransportData?.modeData?.color,
                                        lightTextColor: origin.leavingTransportData?.modeData?.lightColor
                                    },
                                    preIcon: {
                                        class: origin.leavingTransportData?.modeData?.icon ?? '',
                                        color: origin.leavingTransportData?.modeData?.color
                                    },
                                    // postIcon?: DivIconDrawOptionsColoredIcon
                                },
                                time: origin.leavingTransportData?.delayedStartTime ?? null,
                                status: (origin.leavingTransportData?.status ?? null) as DelayStatus,
                                class: 'grid justify-items-end',
                            },
                        ],
                        containerClass: 'map-stop-label',
                        iconAnchor: [0, 0]
                    }
                ));
            });
        return layerGroup;
    }

    updateTransportLayer(layerGroup: L.LayerGroup, transportLocations: TripPathTransportData[] | null): L.LayerGroup<L.Marker> | null {
        if (!layerGroup) return null;
        if (!transportLocations) return null;

        layerGroup.clearLayers();

        transportLocations.forEach((vehicle: TripPathTransportData) => {
            layerGroup.addLayer(this.mapService.drawDivIcon(
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

    updateLocationMarker(map: L.Map, marker: L.Marker | null, pos: { lat: number; lng: number; heading: number }): L.Marker {
        const icon = this.mapService.drawDivIcon(
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
}