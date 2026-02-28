import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { EMPTY, Observable, ObservableInput, of, Subject, throwError, timer } from 'rxjs';
import { debounceTime, switchMap, catchError, retryWhen, tap, delay, shareReplay, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RestRequestOptions } from '../shared/models/api/request';


import { getErrorMessage } from '../shared/constants/error-code';
import { MessageService } from './message.service';
import { PlaceApiResponse } from '../shared/models/api/response-place';
import { RouteApiResponse } from '../shared/models/api/response-route';
import { RealtimeTripResponse } from '../shared/models/api/response-realtime';
import { TripResponse } from '../shared/models/api/response-trip';
import { VehicleTripResponse } from '../shared/models/api/response-vehicle-trip';
import { TransportLocationResponse } from '../shared/models/api/response-transport-location';
import { NearbyVehicleResponse } from '../shared/models/api/response-nearby-vehicle';

@Injectable({
    providedIn: 'root',
})
export class RestApiService {
    private apiUrl = environment.apiUrl;

    private http: HttpClient = inject(HttpClient);
    private messageService: MessageService = inject(MessageService);

    // rivate subjectMap = new Map<string, { input: Subject<any>, output: Subject<any> }>();
    // private subjectMap = new Map<string, { input: Subject<RestRequestOptions>; output: Observable<any> }>();
    private subjectMap = new Map<string, { input: Subject<RestRequestOptions>; output: Subject<any> }>();

    private errorNotificationSubject = new Subject<void>();
    errorNotification$ = this.errorNotificationSubject.asObservable();

    /**
     * This method creates a debounced and switchMapped data stream
     * that emits HTTP request results via a Subject.
     * 
     * IMPORTANT: The returned Observable does not complete automatically,
     * so the caller must manually unsubscribe (for instance, using take(1)),
     * otherwise memory leaks and unintended behavior may occur.
     **/

    private doRequest<T>(
        method: 'get' | 'post' | 'put' | 'delete',
        url: string,
        options: RestRequestOptions
    ): Observable<T> {
        const key = `${method}:${url}:${options.streamName}`;

        if (!this.subjectMap.has(key)) {
            const input = new Subject<RestRequestOptions>();
            const output = new Subject<T>();

            this.subjectMap.set(key, { input, output });

            // console.log('options: ', options);

            input.pipe(
                debounceTime(options?.useDebounce ? options?.debounceMs || 0 : 0),
                switchMap(opts => this.http.request<T>(method, url, opts)),
                tap({
                    error: err => {
                        this.handleError(err);
                    }
                }),
                retry({     // block next stage of pipe (catchError)
                    delay: () => timer(1000)        // retry({ count: 3, delay: () => timer(1000) }) 
                }),
                /* catchError(err => {     // when count presents, after 3 tries catchError runs and stream ends
                    this.handleError(err);
                    return throwError(() => err);
                }) */
            ).subscribe({
                next: result => output.next(result),
                error: err => output.error(err)
            });
        }

        const { input, output } = this.subjectMap.get(key)!;

        input.next(options);

        return output.asObservable();
    }

    private handleError(error: HttpErrorResponse): void {       // Observable<never> {
        this.messageService.showError(getErrorMessage(error));
        this.errorNotificationSubject.next();
        // return throwError(() => error);
    }

    public getPlaces(options: RestRequestOptions): Observable<PlaceApiResponse> {
        return this.doRequest('get', `${this.apiUrl}get-places/`, options);
    }

    public getRoute(options: RestRequestOptions): Observable<RouteApiResponse> {
        return this.doRequest('post', `${this.apiUrl}get-route/`, options);
    }

    public getTrip(options: RestRequestOptions): Observable<TripResponse> {
        return this.doRequest('post', `${this.apiUrl}get-trip/`, options);
    }

    public getTripPath(options: RestRequestOptions): Observable<RealtimeTripResponse> {
        return this.doRequest('post', `${this.apiUrl}get-trip-path/`, options);
    }

    public getVehicleTrip(options: RestRequestOptions): Observable<VehicleTripResponse> {
        return this.doRequest('post', `${this.apiUrl}get-vehicle-trip/`, options);
    }

    public getVehiclePosition(options: RestRequestOptions): Observable<TransportLocationResponse> {
        return this.doRequest('post', `${this.apiUrl}get-vehicle-position/`, options);
    }

    public getNearbyVehicles(options: RestRequestOptions): Observable<NearbyVehicleResponse> {
        return this.doRequest('post', `${this.apiUrl}get-nearby-vehicles/`, options);
    }

    public getLocation(options: any): Observable<any> {    // TODO TYPES
        console.log('getLocation e: ', options);
        return this.doRequest('get', `${this.apiUrl}get-location`, options);
    }

    // ----- UNUSED ----- //

    public getRoutePath(options: RestRequestOptions): Observable<any> {
        console.log('getRoutePath e: ', options);
        return this.doRequest('post', `${this.apiUrl}get-route-path/`, options);
    }
}