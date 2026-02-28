import { inject, Injectable } from "@angular/core";
import { catchError, interval, map, Observable, startWith, switchMap, tap, throwError } from "rxjs";
import { RouteService } from "./route.service";
import { AppSettingsService } from "./app-settings.service";
import { RestApiService } from "./rest-api.service";
import { VEHICLE_POSITION_QUERY } from "../shared/constants/query/vehicle-location-query";
import { TransportLocationResponse } from "../shared/models/api/response-transport-location";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { MapTransportData } from "../shared/models/common";
import polyline from '@mapbox/polyline';
import { GraphQLErrorService } from "./graphql-error.service";

@Injectable({
    providedIn: 'root',
})
export class TransportLocationFreeService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private appSettingsService: AppSettingsService = inject(AppSettingsService);
    private graphQLErrorService: GraphQLErrorService = inject(GraphQLErrorService);


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

    createTransportLocationData(response: TransportLocationResponse): MapTransportData[] {
        const vehicles = response.data.vehiclePositionsForTrips;
        if (!vehicles?.length) return [];

        return vehicles
            .filter(v => v.trip && v.trip.route && v.trip.tripGeometry?.points)
            .map((vehicle): MapTransportData => {
                const trip = vehicle.trip!;
                const route = trip.route!;
                const modeData = TRANSPORT_MODE[route.mode];

                const rawLabel = (route as any)?.[modeData.name] ?? '';
                const label = rawLabel.replace(/\s+/g, '').trim().slice(0, 5);

                return {
                    vehicleId: vehicle.vehicleId ?? '',
                    tripGtfsId: trip.gtfsId ?? '',
                    heading: vehicle.heading ?? 0,
                    speed: vehicle.speed ?? 0,
                    label,
                    mode: route.mode,
                    modeData,
                    geometry: {
                        type: 'Point',
                        coordinates: [vehicle.lat ?? 0, vehicle.lon ?? 0] as [number, number],
                    },
                    tripGeometry: polyline.decode(trip.tripGeometry.points ?? '') as [number, number][],
                };
            });
    }
}