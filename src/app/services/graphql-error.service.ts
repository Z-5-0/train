import { inject, Injectable } from "@angular/core";
import { MessageService } from "./message.service";
import { GraphQLResponseError, MessageItem, MessageTemplate, MessageTransportIcon, TransportMode } from "../shared/models/common";
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
    null;

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
        'vehiclePositionsForTrips': 'Full route path for the vehicle is currently unavailable.',
        'vehiclePositions': 'No vehicles found in the selected area.',
        'vehiclePositions.*': 'Vehicle {{label}} has no data available.',
        'vehiclePositions.*.trip': 'Vehicle {{label}} has no trip assigned.',
        'vehiclePositions.*.trip.route': 'Trip {{label}} has no route information.',
        'vehiclePositions.*.trip.tripGeometry': 'Trip {{label}} has no geometry data for the route.',
        'undefined': 'Failed to retrieve all required data.',
        'unknown': 'Unknown API call error.',
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

        this.callMessageService('general', [{
            text: this.errorMessages['unknown'],
            icon: null
        }]);
    }

    private createErrorKeysSet(errors: GraphQLResponseError[]): string[] {
        return [...new Set<string>(
            errors.map((err: GraphQLResponseError) =>
                err.path?.join('.') ?? ''
            )
        )]
    }

    private callMessageService(template: MessageTemplate, message: MessageItem[]) {
        this.messageService.showMessage(
            template,
            'error',
            Array.isArray(message) ? message : [message]
        );
    }

    private handleSimpleErrors(errors?: GraphQLResponseError[]) {
        const errorKeys = this.createErrorKeysSet(errors ?? []);
        const messages: MessageItem[] = errorKeys.map((key: string) => ({
            text: this.errorMessages[key] ?? this.errorMessages[this.defaultErrorKey],
            icon: null
        }));
        this.callMessageService('general', messages);
    }

    private handleIndexedErrors(errors?: GraphQLResponseError[]): void {
        const errorKeys = this.createErrorKeysSet(errors ?? []);
        const messages: MessageItem[] = errorKeys.map((key: string) => {
            const parts = key.split('.');
            const label = parts.length === 3 ? `#${Number(parts[2]) + 1}` : '';
            const normalizedKey = parts.length === 3 ? 'plan.itineraries.*' : key;
            return {
                text: (this.errorMessages[normalizedKey] ?? this.errorMessages[this.defaultErrorKey]).replace('{{label}}', label),
                icon: null
            };
        });
        this.callMessageService('general', messages);
    }

    private handleLabeledErrors(data: LabeledHandlerDataType, errors?: readonly GraphQLResponseError[]) {
        const isArray = Array.isArray(data) && data.length > 0;
        const isObject = !isArray && typeof data === 'object' && data !== null;

        if (!isArray && !isObject) {
            this.callMessageService('general', [{
                text: this.errorMessages[this.defaultErrorKey],
                icon: null
            }]);
            return;
        }

        if (!errors?.[0]?.path?.length) {
            this.callMessageService('general', [{
                text: this.errorMessages[this.defaultErrorKey],
                icon: null
            }]);
            return;
        }

        const message: MessageItem[] = errors.map((err: GraphQLResponseError) => {
            const { errorKey, label, icon } = this.processErrorKeyAndLabel(data, err.path ?? []);
            const baseMessage = this.errorMessages[errorKey] ?? this.errorMessages[this.defaultErrorKey];
            return { text: baseMessage.replace('{{label}}', label ?? ''), icon };
        });

        this.callMessageService('transport', message);
    }

    private processErrorKeyAndLabel(
        data: LabeledHandlerDataType,
        [firstSegment, secondSegment, thirdSegment, fourthSegment]: string[],
    ): { errorKey: string; label: string, icon: MessageTransportIcon | null } {
        const isArray = Array.isArray(data) && data.length > 0;
        const isObject = !Array.isArray(data) && typeof data === 'object' && data !== null;

        let errorKey = '';
        let label = '';
        let icon = null;

        if (isObject) {
            ({ errorKey, label, icon } = this.getErrorKeyAndLabelForObject(
                data,
                [firstSegment, secondSegment, thirdSegment, fourthSegment]
            ));
        };
        if (isArray) {
            ({ errorKey, label, icon } = this.getErrorKeyAndLabelForArray(
                data,
                [firstSegment, secondSegment, thirdSegment, fourthSegment]
            ));
        };

        return { errorKey, label, icon };
    }

    private getErrorKeyAndLabelForObject(
        data: Record<string, RealtimeTripData | null>,
        segments: string[]
    ): { errorKey: string; label: string; icon: MessageTransportIcon | null } {
        const [firstSegment, ...restSegments] = segments;

        const normalizedFirst = firstSegment.replace(/\d+$/, '');
        const errorKey = [normalizedFirst, ...restSegments].filter((s: string) => !!s).join('.');

        const trip = data[firstSegment];
        const route = trip?.route;

        if (!route) {
            return {
                errorKey,
                label: '—',
                icon: null
            };
        }

        const modeData = TRANSPORT_MODE[route.mode as TransportMode];
        const key = modeData.name as keyof RealtimeTripDataRoute;

        const label = route[key] ?? '—';
        const icon: MessageTransportIcon | null = route
            ? {
                mode: route.mode as TransportMode,
                modeData: TRANSPORT_MODE[route.mode as TransportMode] ?? TRANSPORT_MODE['ERROR'],
                color: `#${route.color}`,
                textColor: `#${route.textColor}`,
                name: route[key] ?? '—'
            }
            : null;

        return { errorKey, label, icon };
    }

    private getErrorKeyAndLabelForArray(
        data: VehiclePositionData[],
        segments: string[]
    ): { errorKey: string; label: string; icon: MessageTransportIcon | null } {
        const [_, indexSegment] = segments;

        const idx = Number(indexSegment);
        const vehicle = Number.isInteger(idx) ? data[idx] : undefined;

        const trip = vehicle?.trip;
        const route = trip?.route;

        const label = trip?.routeShortName ?? vehicle?.label ?? '-';

        const icon: MessageTransportIcon | null = route ? {
            mode: route.mode,
            modeData: TRANSPORT_MODE[route.mode as TransportMode],
            color: `#${route.color}`,
            textColor: `#${route.textColor}`,
            name: trip?.routeShortName ?? '—'
        } : null;

        const errorKey: string = segments
            .map((seg: string, i: number) => (i === 1 && seg ? '*' : seg))
            .filter((s: string): s is string => !!s)
            .join('.');

        return { errorKey, label, icon };
    }
}