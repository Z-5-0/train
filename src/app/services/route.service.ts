import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Place, PlaceGroup, TravelDirectionsKeys } from "../shared/models/place";
import { Route, RouteSequence } from "../shared/models/route";
import { DateTime } from 'luxon';

@Injectable({
    providedIn: 'root',
})
export class RouteService {
    private _selectedPlace$ = new BehaviorSubject<{ originPlace: Place | null, destinationPlace: Place | null }>({
        originPlace: null,
        destinationPlace: null
    });
    readonly selectedPlaces$ = this._selectedPlace$.asObservable();

    private _placeCollection$ = new BehaviorSubject<{ originPlaces: PlaceGroup | null, destinationPlaces: PlaceGroup | null }>({
        originPlaces: null,
        destinationPlaces: null
    });
    readonly placeCollection$ = this._placeCollection$.asObservable();

    private _routeOptions$ = new BehaviorSubject<Route[] | null>(null);
    readonly routeOptions$ = this._routeOptions$.asObservable();

    private _selectedRoute$ = new BehaviorSubject<Route | null>(null);
    readonly selectedRoute$ = this._selectedRoute$.asObservable();

    private _routeSearchDateTime$ = new BehaviorSubject<string | null>(null);
    readonly routeSearchDateTime$ = this._routeSearchDateTime$.asObservable();

    private readonly _selectedRouteKey$ = new BehaviorSubject<string | null>(null);
    readonly selectedRouteKey$ = this._selectedRouteKey$.asObservable();

    constructor() {
        /* const stored = localStorage.getItem('selectedPlaces');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this._selectedPlaces$.next(parsed);
            } catch (e) {
                console.warn('Invalid localStorage state');
            }
        }

        this.selectedPlaces$.subscribe(state => {
            localStorage.setItem('selectedPlaces', JSON.stringify(state));
        }); */
    }

    setRouteSearchDateTime() {
        this._routeSearchDateTime$.next(DateTime.now().toFormat('yyyy-LL-dd HH:mm'));
    }

    getRouteSearchDateTime(): string | null {
        return this._routeSearchDateTime$.getValue();
    }

    setSelectedPlace(places: Partial<Record<TravelDirectionsKeys, Place | null>>) {
        this._selectedPlace$.next({ ...this._selectedPlace$.getValue(), ...places });
    }

    getSelectedPlace(): { originPlace: Place | null; destinationPlace: Place | null } {
        return this._selectedPlace$.getValue();
    }

    swapSelectedPlace() {
        const current = this._selectedPlace$.getValue();
        [current.originPlace, current.destinationPlace] = [current.destinationPlace, current.originPlace];
    }

    setPlaceCollection(field: string, places: PlaceGroup | null) {
        const current = this._placeCollection$.getValue();
        this._placeCollection$.next({ ...current, [field]: places });
    }

    getPlaceCollection(): { originPlaces: PlaceGroup | null; destinationPlaces: PlaceGroup | null } {
        return this._placeCollection$.getValue();
    }

    setRouteOptions(routeOptions: Route[] | null): void {
        this._routeOptions$.next(routeOptions);
    }

    getRouteOptions(): Route[] | null {
        return this._routeOptions$.getValue();
    }

    setSelectedRoute(route: Route | null) {
        this.setRoutePath(route?.sequences);
        this.setSelectedRouteKey(route || null);
        this._selectedRoute$.next(route);
    }

    getSelectedRoute(): Route | null {
        return this._selectedRoute$.getValue();
    }

    setRoutePath(sequences: any | null) {      // TODO TYPE
        if (!sequences) {
            return;
        }

        

        console.log('setRoutePath sequences: ', sequences);
    }

    setSelectedRouteKey(route: Route | null) {
        if (!route || !route?.sequences.length) {
            this._selectedRouteKey$.next(null);
            return;
        }

        const key = `${route.sequences.length}_` + route.sequences
            .map(seq => seq.transportInfo?.id ?? '0')
            .join('_');
        this._selectedRouteKey$.next(key);
    }

    getSelectedRouteKey(): string | null {
        return this._selectedRouteKey$.getValue();
    }
}