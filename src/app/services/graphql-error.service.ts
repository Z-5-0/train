import { inject, Injectable } from "@angular/core";
import { MessageService } from "./message.service";
import { GraphQLResponseError, TransportMode } from "../shared/models/common";
import { TripResponse } from "../shared/models/api/response-trip";
import { RealtimeTripData, RealtimeTripDataRoute, RealtimeTripResponse } from "../shared/models/api/response-realtime";
import { TRANSPORT_MODE } from "../shared/constants/transport-mode";
import { RouteApiResponse } from "../shared/models/api/response-route";
import { VehicleTripResponse } from "../shared/models/api/response-vehicle-trip";
import { TransportLocationResponse } from "../shared/models/api/response-transport-location";
import { NearbyVehicleResponse, VehiclePositionData } from "../shared/models/api/response-nearby-vehicle";

type APIResponseMap = {
    getRoute: RouteApiResponse;
    getTrip: TripResponse;
    getTripPath: RealtimeTripResponse;
    getVehicleTrip: VehicleTripResponse;
    getVehiclePosition: TransportLocationResponse;
    getNearbyVehicles: NearbyVehicleResponse;
};

type LabeledHandlerDataType =
    VehiclePositionData[] |
    Record<string, RealtimeTripData | null> |
    null

@Injectable({
    providedIn: 'root',
})
export class GraphQLErrorService {
    private messageService: MessageService = inject(MessageService);

    private readonly defaultErrorKey = 'undefined';

    private errorMessages: Record<string, string> = {
        'plan': 'Route planning is currently not available.',
        'plan.itineraries': 'No routes were found for the selected parameters.',
        'plan.itineraries.*': 'Some data is missing for route {{label}}.',
        'trip': 'Trip data is not available.',
        'trip.vehiclePositions': 'Vehicle position is not available.',
        'trip.stoptimes': 'Stop time information is not available.',
        'trip.alerts': 'Service alerts are not available.',
        'trip.infoServices': 'Additional service information is not available.',
        'trip.route': 'Route data is not available.',
        'trip_': 'Trip data is not available for trip {{label}}.',
        'trip_.vehiclePositions': 'Vehicle position is not available for trip {{label}}.',
        'trip_.tripGeometry': 'Full route path for trip {{label}} is currently unavailable.',
        'trip_.route': 'Route information is not available for trip {{label}}.',
        'trip_.stoptimes': 'Stop time information is not available for trip {{label}}.',
        'vehiclePositionsForTrips': 'Vehicle position could not be loaded.',
        'vehiclePositions': 'No vehicles found in the selected area.',
        'vehiclePositions.*': 'Vehicle {{label}} has no data available.',
        'vehiclePositions.*.trip': 'Vehicle {{label}} has no trip assigned.',
        'vehiclePositions.*.trip.route': 'Trip {{label}} has no route information.',
        'vehiclePositions.*.trip.tripGeometry': 'Trip {{label}} has no geometry data for the route.',
        'undefined': 'Failed to retrieve all required data.',
    };

    private handlers: {
        [K in keyof APIResponseMap]:
        (response: APIResponseMap[K]) => void;
    } = {
            getRoute: (response) =>
                this.handleIndexedErrors(
                    response.errors
                ),
            getTrip: (response) =>
                this.handleSimpleErrors(
                    response.errors
                ),
            getTripPath: (response) =>
                this.handleLabeledErrors(
                    response.data,
                    response.errors
                ),
            getVehicleTrip: (response) =>
                this.handleSimpleErrors(
                    response.errors
                ),
            getVehiclePosition: (response) =>
                this.handleSimpleErrors(
                    response.errors
                ),
            getNearbyVehicles: (response) =>
                this.handleLabeledErrors(
                    response.data.vehiclePositions,
                    response.errors
                ),
        };

    handleErrors<K extends keyof APIResponseMap>(context: K, response: APIResponseMap[K]) {
        if (!response?.errors?.length) return;

        console.warn('GraphQLErrorService:', context, response.errors);

        const handler = this.handlers[context];

        if (handler) {
            handler(response)
            return;
        };

        this.showMessage('Unknown API call error.');
    }

    private createErrorKeysSet(errors: GraphQLResponseError[]): string[] {
        return [...new Set<string>(
            errors.map((err: GraphQLResponseError) =>
                err.path?.join('.') ?? ''
            )
        )]
    }

    private showMessage(message: string) {
        this.messageService.showError(message);
    }

    private handleSimpleErrors(errors?: GraphQLResponseError[]) {
        const errorKeys = this.createErrorKeysSet(errors ?? []);
        const message = errorKeys
            .map(key => this.errorMessages[key] ?? this.errorMessages[this.defaultErrorKey])
            .join('\n');
        this.showMessage(message);
    }

    private handleIndexedErrors(errors?: GraphQLResponseError[]) {
        const errorKeys = this.createErrorKeysSet(errors ?? []);
        const message = errorKeys
            .map(key => {
                const parts = key.split('.');
                const label = parts.length === 3 ? `#${Number(parts[2]) + 1}` : '';
                const normalizedKey = parts.length === 3 ? 'plan.itineraries.*' : key;
                return (this.errorMessages[normalizedKey] ?? this.errorMessages[this.defaultErrorKey]).replace('{{label}}', label);
            })
            .join('\n');
        this.showMessage(message);
    }

    private handleLabeledErrors(data: LabeledHandlerDataType, errors?: readonly GraphQLResponseError[]) {
        const isArray = Array.isArray(data) && data.length > 0;
        const isObject = !isArray && typeof data === 'object' && data !== null;

        if (!isArray && !isObject) {
            this.showMessage(this.errorMessages[this.defaultErrorKey]);
            return;
        }

        const message = (errors ?? [])
            .map((err: GraphQLResponseError) => {
                const segments = err.path ?? [];

                if (!segments[0]) {
                    this.showMessage(this.errorMessages[this.defaultErrorKey]);
                    return;
                }

                const { errorKey, label } = this.processErrorKeyAndLabel(data, segments);

                const baseMessage =
                    this.errorMessages[errorKey] ??
                    this.errorMessages[this.defaultErrorKey];

                return baseMessage.replace('{{label}}', label ?? '');
            })
            .join('\n');

        this.showMessage(message);
    }

    private processErrorKeyAndLabel(
        data: Record<string, any> | any[],
        [firstSegment, secondSegment, thirdSegment]: string[]
    ): { errorKey: string; label: string } {
        const isArray = Array.isArray(data) && data.length > 0;
        const isObject = !Array.isArray(data) && typeof data === 'object' && data !== null;

        let errorKey = '';
        let label = '';

        if (isObject) {
            ({ errorKey, label } = this.getErrorKeyAndLabelForObject(data, [firstSegment, secondSegment, thirdSegment]));
        };
        if (isArray) {
            ({ errorKey, label } = this.getErrorKeyAndLabelForArray(data, [firstSegment, secondSegment, thirdSegment]));
        };

        return { errorKey, label };
    }

    private getErrorKeyAndLabelForObject(data: Record<string, any>, segments: string[]): { errorKey: string; label: string } {
        const [firstSegment, secondSegment, thirdSegment] = segments;
        const route = data[firstSegment]?.route;
        const mode = route?.mode as TransportMode;
        const tm = TRANSPORT_MODE[mode] ?? TRANSPORT_MODE['ERROR'];
        const key = tm.name as keyof RealtimeTripDataRoute;
        const label = route?.[key] ?? '-';
        const normalizedTrip = firstSegment.replace(/\d+$/, '');
        const errorKey = `${normalizedTrip}${secondSegment ? '.' + secondSegment : ''}`;
        return { errorKey, label };
    }

    private getErrorKeyAndLabelForArray(data: any[], segments: string[]): { errorKey: string; label: string } {
        const [firstSegment, secondSegment, thirdSegment] = segments;
        let vehicle: any;
        if (secondSegment !== undefined) {
            const idx = parseInt(secondSegment, 10);
            vehicle = Number.isInteger(idx) ? data[idx] : undefined;
        }
        const label = vehicle?.trip?.routeShortName ?? vehicle?.label ?? '-';
        let errorKey = firstSegment;
        if (secondSegment !== undefined) errorKey += '.*';
        if (thirdSegment) errorKey += '.' + thirdSegment;
        return { errorKey, label };
    }
}