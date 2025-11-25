import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Place, PlaceGroup, TravelDirectionsKeys } from "../shared/models/place";
import { Route, RouteSequence } from "../shared/models/route";
import { DateTime } from 'luxon';
import { RoutePath } from "../shared/models/path";

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

    private _routePath$ = new BehaviorSubject<RoutePath | null>(null);
    readonly routePath$ = this._routePath$.asObservable();

    private _selectedTripIds$ = new BehaviorSubject<(string | null)[]>([]);
    readonly selectedTripIds$ = this._selectedTripIds$.asObservable();

    constructor() {
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
        this.setSelectedTripIds(route?.sequences ?? []);
        // this.setSelectedRouteKey(route || null);
        this._selectedRoute$.next(route);
    }

    getSelectedRoute(): Route | null {
        return this._selectedRoute$.getValue();
    }

    setSelectedTripIds(sequences: RouteSequence[]): void {
        if (!sequences?.length) {
            this._selectedTripIds$.next([]);
            return;
        }

        const ids = sequences
            .map(seq => seq.transportInfo?.gtfsId ?? null)
        // .filter((id): id is string => Boolean(id));     // filters all falsy values and guarantees string values

        this._selectedTripIds$.next(ids);
    }

    getSelectedTripIds(): (string | null)[] {
        return this._selectedTripIds$.getValue();
    }

    getSelectedTransportGtfsIds() {
        const route = this._selectedRoute$.getValue();

        const routeGtfsIds = route?.sequences
            .filter(seq => seq.mode !== 'WALK')
            .map(seq => seq.transportInfo?.gtfsId);

        return routeGtfsIds;
    }
}