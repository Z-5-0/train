import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';
import { RestApiService } from './rest-api.service';

@Injectable({ providedIn: 'root' })
export class GeolocationService {
    constructor(private restApi: RestApiService) { }

    getCurrentLocationInfo$(): Observable<{ currentLocation: string; originPlace: any } | null> {
        return new Observable<GeolocationPosition>((observer) => {
            if (!navigator.geolocation) {
                observer.error(new Error('Geolocation is not supported by this browser.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    observer.next(position);
                    observer.complete();
                },
                (error) => observer.error(error)
            );
        }).pipe(
            take(1),
            switchMap(position => this.restApi.getLocation({
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
            )),
            catchError(err => {
                return of(null);
            })
        );
    }
}
