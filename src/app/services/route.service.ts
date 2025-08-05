import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Place, PlaceGroup } from "../shared/models/place";
import { Route } from "../shared/models/route";

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

    setSelectedPlace(field: string, place: Place | null) {
        const current = this._selectedPlace$.getValue();
        this._selectedPlace$.next({ ...current, [field]: place });
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
        this._selectedRoute$.next(route);
    }
    getSelectedRoute(): Route | null {
        return this._selectedRoute$.getValue();
    }
}