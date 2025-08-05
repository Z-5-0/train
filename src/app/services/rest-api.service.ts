import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';
import { debounceTime, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { RestRequestOptions } from '../shared/models/api/request';


import { getErrorMessage } from '../shared/constants/error-code';
import { MessageService } from './message.service';
import { PlaceApiResponse } from '../shared/models/api/response-place';

@Injectable({
    providedIn: 'root',
})
export class RestApiService {
    private apiUrl = environment.apiUrl;

    private http: HttpClient = inject(HttpClient);

    private subjectMap = new Map<string, { input: Subject<any>, output: Subject<any> }>();

    private messageService: MessageService = inject(MessageService);

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

            input.pipe(
                debounceTime(options.debounceMs || 0),
                switchMap(opts =>
                    this.http.request<T>(method, url, opts).pipe(
                        catchError(err => {
                            this.handleError(err)
                            return of({ features: [] } as T);
                        })
                    )
                )
            ).subscribe(result => {
                output.next(result);    // output result
            });
        }

        const { input, output } = this.subjectMap.get(key)!;

        input.next(options);

        return output.asObservable();
    }

    private handleError(error: HttpErrorResponse): Observable<never> {
        this.messageService.showError(getErrorMessage(error));
        return throwError(() => new Error(getErrorMessage(error)));
    }

    public getPlaces(event: any): Observable<PlaceApiResponse> {    // TODO EVENT TYPE
        return this.doRequest('get', `${this.apiUrl}get-places/`, event);
    }

    public getRoute(event: any): Observable<any> {    // TODO TYPES
        return this.doRequest('post', `${this.apiUrl}get-route/`, event);
    }

    /* public getTrain(event: any): Observable<any> {    // TODO TYPES
        return this.doRequest('post', `${this.apiUrl}get-train/`, event);
    } */

    public getTrip(event: any): Observable<any> {    // TODO TYPES
        return this.doRequest('post', `${this.apiUrl}get-trip/`, event);
    }

    public getLocation(event: any): Observable<any> {    // TODO TYPES
        return this.doRequest('get', `${this.apiUrl}get-location`, event);
    }
}