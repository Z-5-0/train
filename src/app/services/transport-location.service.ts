import { inject, Injectable } from "@angular/core";
import { BehaviorSubject, catchError, EMPTY, from, interval, map, Observable, of, startWith, switchMap, tap, throwError } from "rxjs";
import { RouteService } from "./route.service";
import { AppSettingsService } from "./app-settings.service";
import { RestApiService } from "./rest-api.service";
import { VEHICLE_POSITION_QUERY } from "../shared/constants/query/vehicle-location-query";
import { DateTime } from "luxon";
import { TransportLocationResponse } from "../shared/models/api/response-transport-location";
import { point } from "leaflet";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { TransportLocation } from "../shared/models/transport-location";
import { TransportMode } from "../shared/models/common";

@Injectable({
    providedIn: 'root',
})
export class TransportLocationService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);

    private _locations$ = new BehaviorSubject<any>(null);       // TODO TYPE
    readonly locations$ = this._locations$.asObservable();

    getTransportLocationPolling() {
        return this.appSettingsService.appSettings$.pipe(
            map(settings => settings['updateTime']),
            switchMap(ms =>
                interval(ms).pipe(
                    startWith(0),
                    switchMap(() => this.getTransportLocation())
                )
            )
        );
    }

    getTransportLocation(): Observable<TransportLocation | null> {
        const serviceDay = DateTime.now().toUTC().startOf('day').toMillis();
        const variables = { trips: this.routeService.getSelectedTransportGtfsIds()?.map((id: any) => ({ id, serviceDay })) }

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

    createTransportLocationData(response: TransportLocationResponse): TransportLocation | null {
        if (!response.data.vehiclePositionsForTrips?.length) return null;

        return response.data.vehiclePositionsForTrips?.map(vehicle => {
            return {
                id: vehicle.vehicleId,
                gtfsId: vehicle.trip.gtfsId,
                heading: vehicle.heading,
                label: ((vehicle.trip.route as any)[TRANSPORT_MODE[vehicle.trip.route.mode].name]).replace(/\s+/g, '').trim().slice(0, 5),
                mode: vehicle.trip.route.mode,
                modeData: TRANSPORT_MODE[vehicle.trip.route.mode],
                point: [vehicle.lat, vehicle.lon],
                lastUpdated: DateTime.fromSeconds(vehicle.lastUpdated).toFormat('HH:mm:ss'),
            }
        });
    }
}