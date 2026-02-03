import { inject, Injectable } from "@angular/core";
import { catchError, interval, map, Observable, startWith, switchMap, throwError } from "rxjs";
import { RouteService } from "./route.service";
import { AppSettingsService } from "./app-settings.service";
import { RestApiService } from "./rest-api.service";
import { VEHICLE_POSITION_QUERY } from "../shared/constants/query/vehicle-location-query";
import { TransportLocationResponse } from "../shared/models/api/response-transport-location";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { MapTransportData, TransportMode } from "../shared/models/common";
import polyline from '@mapbox/polyline';

@Injectable({
    providedIn: 'root',
})
export class TransportLocationFreeService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);

    getTransportLocationPolling(tripGtfsId: string): Observable<MapTransportData[]> {
        return this.appSettingsService.appSettings$.pipe(
            map(settings => settings['updateTime']),
            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getTransportLocation(tripGtfsId))
                )
            )
        );
    }

    getTransportLocation(tripGtfsId: string): Observable<MapTransportData[]> {
        // const serviceDay = DateTime.now().toUTC().startOf('day').toMillis();
        const variables = { trips: [{ id: tripGtfsId }] }   // DO NOT SEND SERVICE DAY!

        return this.restApi.getVehiclePosition({
            body: {
                query: VEHICLE_POSITION_QUERY,
                variables: variables
            },
            debounceTime: false
        }).pipe(
            map((response: TransportLocationResponse) => this.createTransportLocationData(response)),
            catchError(err => {     // does not run due to retry in rest-api service
                // return EMPTY;
                return throwError(() => err);       // pushes error towards components
            })
        );
    }

    createTransportLocationData(response: TransportLocationResponse): MapTransportData[] {
        if (!response.data.vehiclePositionsForTrips?.length) return [];

        return response.data.vehiclePositionsForTrips.map((vehicle): MapTransportData => ({
            vehicleId: vehicle.vehicleId,
            tripGtfsId: vehicle.trip.gtfsId,
            heading: vehicle.heading,
            speed: vehicle.speed,
            label: ((vehicle.trip.route as any)[TRANSPORT_MODE[vehicle.trip.route.mode].name]).replace(/\s+/g, '').trim().slice(0, 5),
            mode: vehicle.trip.route.mode,
            modeData: TRANSPORT_MODE[vehicle.trip.route.mode],
            geometry: { type: 'Point', coordinates: [vehicle.lat, vehicle.lon] },
            tripGeometry: polyline.decode(vehicle.trip.tripGeometry.points) as [number, number][]
        }));
    }
}