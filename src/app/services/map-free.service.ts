import { inject, Injectable } from "@angular/core";
import * as L from 'leaflet';
import { AppSettingsService } from "./app-settings.service";
import { BehaviorSubject, catchError, combineLatest, filter, interval, map, Observable, of, startWith, switchMap, tap, throwError } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { createNearbyVehiclesQuery } from "../shared/constants/query/nearby-transport-query";
import { NearbyVehicleResponse, VehiclePositionData } from "../shared/models/api/response-nearby-vehicle";
import { MapTransportData, PointGeometry, TransportMode } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import polyline from '@mapbox/polyline';
import { MapTransportService } from "./map-transport.service";
import { GraphQLErrorService } from "./graphql-error.service";


@Injectable({ providedIn: 'root' })
export class MapFreeService {
    mapTransportService: MapTransportService = inject(MapTransportService);
    appSettingsService: AppSettingsService = inject(AppSettingsService);
    restApi: RestApiService = inject(RestApiService);
    private graphQLErrorService: GraphQLErrorService = inject(GraphQLErrorService);


    private _freeMapPosition$ = new BehaviorSubject<{ bounds: L.LatLngBounds, zoom: number } | null>(null);
    readonly freeMapPosition$ = this._freeMapPosition$.asObservable();

    setBounds(bounds: L.LatLngBounds, zoom: number) {
        this._freeMapPosition$.next({ bounds, zoom });
    }

    startFreeMapDataPolling() {
        return combineLatest([
            this.appSettingsService.appSettings$.pipe(map(settings => settings['updateTime'])),
            this._freeMapPosition$.pipe(filter(b => !!b))   // bounding box must exist
        ]).pipe(
            switchMap(([ms, bounds]) =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getFreeMapData(bounds.bounds, bounds.zoom))
                )
            )
        );
    }

    getFreeMapData(bounds: L.LatLngBounds, zoom: number): Observable<MapTransportData[]> {
        const query = createNearbyVehiclesQuery(bounds, zoom);

        if (!query) {
            return of([]);
        }

        return this.restApi.getNearbyVehicles({
            body: {
                query,  // swLat: number, swLon: number, neLat: number, neLon: number
                variables: {}
            },
            debounceTime: false
        }).pipe(
            tap((response: NearbyVehicleResponse) => this.graphQLErrorService.handleErrors('getNearbyVehicles', response)),
            map((response: NearbyVehicleResponse) => this.transformFreeMapResonse(response)),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    transformFreeMapResonse(data: NearbyVehicleResponse): MapTransportData[] {
        return data.data.vehiclePositions.map((vehicle: VehiclePositionData): MapTransportData => {
            const trip = vehicle.trip;
            const route = trip?.route;

            const vehicleMode = route?.mode ?? '';
            const modeData = TRANSPORT_MODE[vehicleMode || 'ERROR'];

            const labelKey = route ? (TRANSPORT_MODE[vehicleMode].name as keyof typeof route) : undefined;
            const vehicleLabel = route && labelKey ? route[labelKey] : '';
            const label = vehicleLabel?.split(/[\/-]/)[0]?.replace(/\s/g, "")?.slice(0, 5) ?? '';

            const tripGeometryPoints = trip?.tripGeometry?.points ?? '';
            const tripGeometry = tripGeometryPoints ? polyline.decode(tripGeometryPoints) as [number, number][] : [];

            return {
                vehicleId: vehicle.vehicleId ?? '',
                label,
                heading: vehicle.heading ?? 0,
                speed: vehicle.speed ?? 0,
                mode: vehicleMode as TransportMode,
                modeData,
                geometry: {
                    type: 'Point',
                    coordinates: [vehicle.lat ?? 0, vehicle.lon ?? 0]
                } as PointGeometry,
                tripGtfsId: trip?.gtfsId ?? '',
                tripGeometry
            };
        });
    }
}