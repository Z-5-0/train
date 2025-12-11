import { inject, Injectable } from "@angular/core";
import * as L from 'leaflet';
import { AppSettingsService } from "./app-settings.service";
import { BehaviorSubject, catchError, combineLatest, filter, interval, map, Observable, of, startWith, switchMap, tap, throwError } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { createNearbyVehiclesQuery } from "../shared/constants/query/nearby-transport-query";
import { NearbyVehicleResponse } from "../shared/models/api/response-nearby-vehicle";
import { MapTransportData, PointGeometry, TransportMode } from "../shared/models/common";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import polyline from '@mapbox/polyline';


@Injectable({ providedIn: 'root' })
export class MapFreeService {
    appSettingsService: AppSettingsService = inject(AppSettingsService);
    restApi: RestApiService = inject(RestApiService);

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
            map((response: NearbyVehicleResponse) => this.transformFreeMapResonse(response)),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    transformFreeMapResonse(data: NearbyVehicleResponse): MapTransportData[] {
        return data.data.vehiclePositions.map((vehicle: any) => {
            const vehicleMode = vehicle.trip.route.mode as TransportMode;
            const labelKey = TRANSPORT_MODE[vehicleMode].name as keyof typeof vehicle.trip.route;
            const vehicleLabel = vehicle.trip.route[labelKey];
            return {
                vehicleId: vehicle.vehicleId,
                label: vehicleLabel?.split(/[\/-]/)[0]?.replace(/\s/g, "")?.slice(0, 5) || null,
                heading: vehicle.heading ?? null,
                speed: vehicle.speed ?? null,
                mode: vehicle.trip.route.mode,
                modeData: TRANSPORT_MODE[vehicleMode],
                geometry: {
                    type: 'Point',
                    coordinates: [vehicle.lat, vehicle.lon]
                } as PointGeometry,
                tripGeometry: polyline.decode(vehicle.trip.tripGeometry.points) as [number, number][]
            }
        });
    }
}