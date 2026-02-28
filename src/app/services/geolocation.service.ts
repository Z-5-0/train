import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { RestApiService } from './rest-api.service';
import { MessageService } from './message.service';
import { GEOLOCATION_ERROR_MESSAGE } from '../shared/constants/error-geolocation';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
    private restApi: RestApiService = inject(RestApiService);
    private messageService: MessageService = inject(MessageService);

    private _currentLocation$ = new BehaviorSubject<{ lat: number; lng: number; heading: number } | null>(null);
    readonly currentLocation$ = this._currentLocation$.asObservable();

    private watchId: number | null = null;

    ngOnInit() {
        // navigator.geolocation.getCurrentPosition(() => { });
    }

    startTracking() {
        if (!navigator.geolocation) {
            // TODO MEESSAGE ?
            return console.error('Geolocation not supported');
        }

        this.watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, heading: rawHeading } = pos.coords;
                const heading = (rawHeading ?? 0) - 45;
                this._currentLocation$.next({ lat, lng, heading });
            },
            (err) => {
                // TODO MEESSAGE ?
                console.error('Geolocation error:', err);
            },
            { enableHighAccuracy: true }
        );
    }

    stopTracking() {
        if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    }

    getCurrentLocation() {
        navigator.geolocation.watchPosition(        // TODO UNSUB?
            (position: GeolocationPosition) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const rawHeading = position.coords.heading;     // Could be null
                const heading = (rawHeading !== null && rawHeading !== undefined ? rawHeading : 0) - 45;

                const pos = { lat, lng, heading };

                this._currentLocation$.next(pos);
            },
            (err) => {
                console.error(err);
                // TODO MESSAGE
            },
            { enableHighAccuracy: true });
    }

    getCurrentLocationInfo$(): Observable<{ currentLocation: string; originPlace: any } | null> {
        return new Observable<GeolocationPosition | null>((observer) => {
            if (!navigator.geolocation) {
                observer.next(null);
                observer.complete();
                this.messageService.showWarning('Geolocation API not available.');
                return;
            }

            const timeoutId = setTimeout(() => observer.complete(), 10000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    // observer.complete();
                },
                (error: GeolocationPositionError) => {
                    this.messageService.showWarning(GEOLOCATION_ERROR_MESSAGE(error.code));

                    observer.next(null);
                    observer.complete();
                }, {
                enableHighAccuracy: false,
                maximumAge: Infinity,
                timeout: 1000
            });

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    clearTimeout(timeoutId);
                    observer.complete();
                },
                (error: GeolocationPositionError) => {
                    this.messageService.showWarning(GEOLOCATION_ERROR_MESSAGE(error.code));

                    observer.next(null);
                    clearTimeout(timeoutId);
                    observer.complete();
                }, {
                enableHighAccuracy: true,
            }
                /* (error: GeolocationPositionError) => {
                    observer.error(error)       // pass error to component
                } */
            );
        }).pipe(
            // take(1),
            distinctUntilChanged((a, b) =>
                a?.coords.latitude === b?.coords.latitude &&
                a?.coords.longitude === b?.coords.longitude
            ),
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
