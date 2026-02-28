import { inject, Injectable } from "@angular/core";
import { catchError, interval, map, Observable, startWith, switchMap, tap, throwError } from "rxjs";
import { RouteService } from "./route.service";
import { AppSettingsService } from "./app-settings.service";
import { RestApiService } from "./rest-api.service";
import { VEHICLE_POSITION_QUERY } from "../shared/constants/query/vehicle-location-query";
import { DateTime } from "luxon";
import { TransportLocationResponse, VehiclePosition } from "../shared/models/api/response-transport-location";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { TransportLocation } from "../shared/models/transport-location";
import { GraphQLErrorService } from "./graphql-error.service";

@Injectable({
    providedIn: 'root',
})
// NOT USED
export class TransportLocationTripService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);
    private graphQLErrorService: GraphQLErrorService = inject(GraphQLErrorService);


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
            useDebounce: false
        }).pipe(
            tap((response: TransportLocationResponse) => this.graphQLErrorService.handleErrors('getVehiclePosition', response)),
            map((response: TransportLocationResponse) => this.createTransportLocationData(response)),
            catchError(err => {     // does not run due to retry in rest-api service
                // return EMPTY;
                return throwError(() => err);       // pushes error towards components
            })
        );
    }

    createTransportLocationData(response: TransportLocationResponse): TransportLocation | null {
        const vehicles = response.data.vehiclePositionsForTrips;
        if (!vehicles?.length) return null;

        const result = vehicles
            .filter(v => v.trip && v.trip.route)
            .map((vehicle) => {
                const route = vehicle.trip.route;
                const modeData = TRANSPORT_MODE[route.mode];

                const rawLabel = (route as any)?.[modeData.name] ?? '';
                const label = rawLabel.replace(/\s+/g, '').trim().slice(0, 5);

                return {
                    id: vehicle.vehicleId,
                    gtfsId: vehicle.trip!.gtfsId,
                    heading: vehicle.heading,
                    label,
                    mode: route.mode,
                    modeData,
                    point: [vehicle.lat, vehicle.lon] as [number, number],
                };
            });

        return result.length ? result : null;
    }
}