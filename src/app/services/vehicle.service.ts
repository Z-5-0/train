import { inject, Injectable } from "@angular/core";
import { catchError, map, Observable, throwError } from "rxjs";
import { RestApiService } from "./rest-api.service";
import { MessageService } from "./message.service";
import { createVehicleTripQuery } from "../shared/constants/query/vehicle-trip-query";
import { RouteService } from "./route.service";
import { DateTime, Duration } from "luxon";
import { DelayStatus } from "../shared/models/common";

@Injectable({
    providedIn: 'root',
})
export class VehicleService {
    private restApi: RestApiService = inject(RestApiService);
    private routeService: RouteService = inject(RouteService);
    private messageService: MessageService = inject(MessageService);

    getVehicleTripData(gtfsId: string): Observable<any | null> {      // TODO TYPE

        return this.restApi.getVehicleTrip({
            body: {
                query: createVehicleTripQuery(gtfsId),
                variables: {}
            },
            debounceTime: false
        }).pipe(
            map((response: any) => this.collectStops(response.data.trip)),      // TODO TYPE
            map((data: any) => this.createVehicleRestStops(data)),      // TODO TYPE
            // tap(() => console.log('update')),
            catchError(err => {
                // TODO MESSAGE
                return throwError(() => err);       // pushes error towards components
                // return of({ data: null });       // TODO ?
            })
        )
    }

    collectStops(vehicleTrip: any) {      // TODO TYPE
        const selectedRoute = this.routeService.getSelectedRoute();
        if (!selectedRoute) return [];

        const vehicleTripId = vehicleTrip.id;
        const vehicleTripStoptimes = vehicleTrip.stoptimes;

        const selectedTransport = selectedRoute?.sequences.find((f: any) => f.transportInfo.id === vehicleTripId);
        if (!selectedTransport) return [];

        const { origin, destination } = selectedTransport;
        let inside = false;

        return vehicleTripStoptimes.filter((st: any) => {
            if (st.stop.gtfsId === origin.gtfsId) {
                inside = true;
                return false;
            }

            if (st.stop.gtfsId === destination.gtfsId) {
                inside = false;
                return false;
            }

            return !inside;
        });
    }

    createVehicleRestStops(restStops: any) {
        return restStops.map((data: any) => {
            return {
                gtfsId: data.stop.gtfsId,
                geometry: {
                    type: 'POINT',
                    coordinates: [data.stop.lat, data.stop.lon]
                },
                label: data.stop.name,

                // FOR POTENTIOAL FUTURE UPDATES

                /* scheduledEndTime: DateTime.fromSeconds(data.serviceDay + data.scheduledArrival)
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                delayedEndTime: DateTime.fromSeconds(
                    data.realtime
                        ? data.serviceDay + data.realtimeArrival
                        : data.serviceDay + data.scheduledArrival + data.arrivalDelay
                )
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                arrivalDelay: (data.arrivalDelay > 0)
                    ? Math.floor(Math.abs(Duration.fromObject({ seconds: data.arrivalDelay }).as('minutes')))
                    : Math.ceil(Math.abs(Duration.fromObject({ seconds: data.arrivalDelay }).as('minutes'))),
                arrivalStatus: (data.arrivalDelay < 0
                    ? 'early'
                    : data.arrivalDelay < 60
                        ? 'on time'
                        : 'late') as DelayStatus,
                scheduledStartTime: DateTime.fromSeconds(data.serviceDay + data.scheduledDeparture)
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                delayedStartTime: DateTime.fromSeconds(
                    data.realtime
                        ? data.serviceDay + data.realtimeDeparture
                        : data.serviceDay + data.scheduledDeparture + data.departureDelay
                )
                    .setZone('Europe/Budapest')
                    .toFormat('HH:mm'),
                departureDelay: (data.departureDelay > 0)
                    ? Math.floor(Math.abs(Duration.fromObject({ seconds: data.departureDelay }).as('minutes')))
                    : Math.ceil(Math.abs(Duration.fromObject({ seconds: data.departureDelay }).as('minutes'))),
                departureStatus: (data.departureDelay < 0
                    ? 'early'
                    : data.departureDelay < 60
                        ? 'on time'
                        : 'late') as DelayStatus */
            }
        })
    }
}