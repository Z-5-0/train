import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { RestApiService } from './rest-api.service';
import { MessageService } from './message.service';
import { GEOLOCATION_ERROR_MESSAGE } from '../shared/constants/error-geolocation';

@Injectable({ providedIn: 'root' })
export class GeolocationService {

    private restApi: RestApiService = inject(RestApiService);
    private messageService: MessageService = inject(MessageService);

    getCurrentLocationInfo$(): Observable<{ currentLocation: string; originPlace: any } | null> {

        return new Observable<GeolocationPosition | null>((observer) => {
            if (!navigator.geolocation) {
                observer.next(null);
                observer.complete();
                this.messageService.showWarning('Geolocation API not available.');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    observer.complete();
                },
                (error: GeolocationPositionError) => {
                    this.messageService.showWarning(GEOLOCATION_ERROR_MESSAGE(error.code));

                    observer.next(null);
                    observer.complete();
                }
                /* (error: GeolocationPositionError) => {
                    observer.error(error)       // pass error to component
                } */
            );
        }).pipe(
            take(1),
            switchMap(position => {
                if (!position) return of(null);

                return this.restApi.getLocation({
                    params: {
                        lat: position.coords.latitude,
                        lon: position.coords.longitude,
                        format: 'json',
                    }
                }).pipe(
                    take(1),
                    map(location => {
                        const currentLocation = `${location.address.postcode},${location.address.region},${location.address.country}::${position.coords.latitude},${position.coords.longitude}`;

                        const originPlace = {
                            id: "1:1_0",
                            uniqueKey: "1:1_0_0",
                            name: "Current location",
                            code: "1",
                            type: "location",
                            mode: "GPS",
                            score: 1,
                            geometry: {
                                type: "Point",
                                coordinates: [location.lon, location.lat]
                            }
                        };

                        return { currentLocation, originPlace };
                    })
                )
            }),
            catchError(err => {
                return of(null);        // component does not get the error
            })
        );
    }
}
