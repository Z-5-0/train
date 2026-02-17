import { inject, Injectable } from "@angular/core";
import { RestApiService } from "./rest-api.service";
import { RouteService } from "./route.service";
import { catchError, filter, map, Observable, of, take, tap, throwError } from "rxjs";
import { createVehicleTripQuery } from "../shared/constants/query/vehicle-trip-query";
import { MessageService } from "./message.service";
import { MapService } from "./map.service";
import { MapTransportData, TransportMode } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import * as L from 'leaflet';
import { VehicleTripResponse, VehicleTripResponseData, VehicleTripStoptime } from "../shared/models/api/response-vehicle-trip";
import { VehicleTripStop } from "../shared/models/vehicle-trip";
import { RouteSequence, TransportInfo } from "../shared/models/route";
import { TripPreviewLayerOptions } from "../shared/models/map";

@Injectable({ providedIn: 'root' })
export class MapTransportService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private mapService: MapService = inject(MapService);
    private messageService: MessageService = inject(MessageService);

    private transportMarkersFree = new Map<string, L.Marker>();
    private transportMarkersTrip = new Map<string, L.Marker>();

    private vehiclePreviewActive: { FREE: MapTransportData | null, TRIP: MapTransportData | null } = { FREE: null, TRIP: null };
    private vehicleTripData$ = new Map<string, Observable<VehicleTripStop[] | null>>();

    getVehiclePreviewActive(mapType: 'FREE' | 'TRIP'): MapTransportData | null {
        return this.vehiclePreviewActive[mapType];
    }

    getMarkerClicked(type: 'FREE' | 'TRIP'): MapTransportData | null {
        return this.vehiclePreviewActive[type] ?? null;
    }

    setMarkerClicked(type: 'FREE' | 'TRIP', vehicle: MapTransportData | null) {
        this.vehiclePreviewActive[type] = vehicle;
    }

    handleVehicleClick(
        layer: L.LayerGroup,
        vehicle: MapTransportData,
        mapType: 'FREE' | 'TRIP'
    ): Observable<void> {
        if (!vehicle.tripGeometry) return of(void 0);

        const layerOptions = layer.options as TripPreviewLayerOptions;
        const currentId = layerOptions.tripGtfsId;

        if (currentId === vehicle.tripGtfsId) {
            layer.clearLayers();
            layerOptions.tripGtfsId = undefined;
            this.vehiclePreviewActive[mapType] = null;
            return of(void 0);
        }

        layer.clearLayers();
        layerOptions.tripGtfsId = vehicle.tripGtfsId;

        return this.getVehicleTripData(vehicle.tripGtfsId, mapType)
            .pipe(
                filter((tripData): tripData is VehicleTripStop[] => !!tripData),
                tap(tripData => this.createTransportTrip(layer, [...tripData], vehicle)),
                map(() => void 0)
            );
    }

    getVehicleTripData(gtfsId: string, mapType: 'FREE' | 'TRIP'): Observable<VehicleTripStop[] | null> {      // TODO TYPE
        const cachedVehicleTripData = this.vehicleTripData$.get(gtfsId);
        if (cachedVehicleTripData) return cachedVehicleTripData;

        return this.restApi.getVehicleTrip({
            body: {
                query: createVehicleTripQuery(gtfsId),
                variables: {}
            },
            debounceTime: false
        }).pipe(
            take(1),
            map((response: VehicleTripResponse) => this.collectStops(response.data.trip, mapType)),
            map((data: VehicleTripStoptime[]) => this.createVehicleRestStops(data)),      // TODO TYPE
            tap(stops => this.vehicleTripData$.set(gtfsId, of(stops))),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    collectStops(vehicleTrip: VehicleTripResponseData, mapType: 'FREE' | 'TRIP'): VehicleTripStoptime[] {
        if (mapType === 'FREE') {
            return vehicleTrip.stoptimes;
        }

        const selectedRoute = this.routeService.getSelectedRoute();
        if (!selectedRoute) return vehicleTrip.stoptimes;

        const selectedTransport = selectedRoute.sequences
            .filter((f): f is RouteSequence & { transportInfo: TransportInfo } => !!f.transportInfo)
            .find((f: RouteSequence & { transportInfo: TransportInfo }) => f.transportInfo['id'] === vehicleTrip.id);

        if (!selectedTransport) return [];

        const unselectedRouteSequences = [...selectedRoute.sequences]
            .filter(seq => seq.transportInfo?.gtfsId !== vehicleTrip.gtfsId)
            .filter(seq => seq.mode !== 'WALK')
            .flatMap(stop => stop.stops);

        const excludedStopIds = new Set(
            unselectedRouteSequences
                .map(s => s?.gtfsId)
                .filter((id): id is string => typeof id === 'string')
        );

        const { origin, destination } = selectedTransport;
        const vehicleTripStoptimes = vehicleTrip.stoptimes;
        let inside = false;

        return vehicleTripStoptimes.filter((stoptime: VehicleTripStoptime) => {
            if (stoptime.stop.gtfsId === origin.gtfsId) {
                inside = true;
                return false;
            }

            if (stoptime.stop.gtfsId === destination.gtfsId) {
                inside = false;
                return false;
            }

            return !inside && !excludedStopIds.has(stoptime.stop.gtfsId);
        });
    }

    createVehicleRestStops(restStops: VehicleTripStoptime[]): VehicleTripStop[] {
        return restStops.map((stop: VehicleTripStoptime): VehicleTripStop => {
            return {
                gtfsId: stop.stop.gtfsId,
                geometry: {
                    type: 'Point',
                    coordinates: [stop.stop.lat, stop.stop.lon]
                },
                label: stop.stop.name,

                // FOR POTENTIOAL FUTURE UPDATES

                /* scheduledEndTime: DateTime.fromSeconds(stop.serviceDay + stop.scheduledArrival)
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                delayedEndTime: DateTime.fromSeconds(
                    stop.realtime
                        ? stop.serviceDay + stop.realtimeArrival
                        : stop.serviceDay + stop.scheduledArrival + stop.arrivalDelay
                )
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                arrivalDelay: (stop.arrivalDelay > 0)
                    ? Math.floor(Math.abs(Duration.fromObject({ seconds: stop.arrivalDelay }).as('minutes')))
                    : Math.ceil(Math.abs(Duration.fromObject({ seconds: stop.arrivalDelay }).as('minutes'))),
                arrivalStatus: (stop.arrivalDelay < 0
                    ? 'early'
                    : stop.arrivalDelay < 60
                        ? 'on time'
                        : 'late') as DelayStatus,
                scheduledStartTime: DateTime.fromSeconds(stop.serviceDay + stop.scheduledDeparture)
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                delayedStartTime: DateTime.fromSeconds(
                    stop.realtime
                        ? stop.serviceDay + stop.realtimeDeparture
                        : stop.serviceDay + stop.scheduledDeparture + stop.departureDelay
                )
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                departureDelay: (stop.departureDelay > 0)
                    ? Math.floor(Math.abs(Duration.fromObject({ seconds: stop.departureDelay }).as('minutes')))
                    : Math.ceil(Math.abs(Duration.fromObject({ seconds: stop.departureDelay }).as('minutes'))),
                departureStatus: (stop.departureDelay < 0
                    ? 'early'
                    : stop.departureDelay < 60
                        ? 'on time'
                        : 'late') as DelayStatus */
            }
        });
    }

    updateTransportLayer(       // not necessary to return with vehicleLayer
        vehicleLayer: L.LayerGroup,
        previewLayer: L.LayerGroup,
        transportLocations: MapTransportData[] | null,
        options: { type: 'FREE' | 'TRIP' },
        onClick: (vehicle: MapTransportData) => void,
        onPreviewEnded?: () => void
    ) {
        if (!vehicleLayer) return null;

        if (!transportLocations || transportLocations.length === 0) {
            vehicleLayer.clearLayers();
            previewLayer.clearLayers();
            this.vehiclePreviewActive[options.type] = null;
            onPreviewEnded?.();
            return vehicleLayer;
        }

        const markersMap = options?.type === 'TRIP'
            ? this.transportMarkersTrip
            : this.transportMarkersFree;

        const layerGroupIsEmpty = vehicleLayer.getLayers().length === 0;

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
                marker.setIcon(this.createTransportMarker(latlng, vehicle, onClick).getIcon());
            } else {
                const marker = this.createTransportMarker(latlng, vehicle, onClick).addTo(vehicleLayer);
                markersMap.set(id, marker);
            }
        });

        markersMap.forEach((marker, id) => {
            if (!transportLocations.find(v => v.vehicleId === id)) {
                vehicleLayer.removeLayer(marker);
                markersMap.delete(id);

                if (this.vehiclePreviewActive[options.type]?.vehicleId === id) {
                    previewLayer.clearLayers();
                    onPreviewEnded?.();
                    this.vehiclePreviewActive[options.type] = null;
                }
            }
        });

        return vehicleLayer;
    }

    createTransportTrip(
        layerGroup: L.LayerGroup,
        stops: VehicleTripStop[],
        vehicle: MapTransportData) {
        if (!layerGroup) return;

        layerGroup.clearLayers();

        layerGroup.addLayer(this.mapService.drawPolyline({
            points: vehicle.tripGeometry,
            color: vehicle.modeData.color,
            weight: 1,
            className: 'map-vehicle-polyline'
        }));

        stops.forEach((stop: VehicleTripStop) => {
            layerGroup.addLayer(this.mapService.drawCircleMarker({
                point: stop.geometry.coordinates,
                color: vehicle.modeData.color,
                fill: true,
                fillOpacity: 1,
                fillColor: vehicle.modeData.color,
                weight: 1,
                radius: 2
            }));

            layerGroup.addLayer(this.mapService.drawDivIcon({
                type: 'stop',
                point: stop.geometry.coordinates,
                label: { name: stop.label },
                color: { textColor: vehicle.modeData.color, lightTextColor: TRANSPORT_MODE[vehicle.mode].lightColor },
                containerClass: 'map-rest-stop-label',
            }));
        });
    }

    createTransportMarker(
        latlng: L.LatLngExpression,
        vehicle: MapTransportData,
        onClick: (vehicle: MapTransportData) => void
    ) {
        const marker = this.mapService.drawDivIcon({
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
            iconSize: [24, 26],
            interactive: true
        });

        marker.on('click', () => {
            onClick(vehicle);
        });

        return marker;
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

    clearTransportMarkersTrip() {
        this.transportMarkersFree.clear();
    }
}