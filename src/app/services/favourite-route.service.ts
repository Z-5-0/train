import { inject, Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { Route } from "../shared/models/route";
import { Place } from "../shared/models/place";
import { LocalStorageService } from "./local-storage.service";
import { RouteService } from "./route.service";
import { SelectableRoute } from "../shared/models/common";
import { MessageService } from "./message.service";


@Injectable({
    providedIn: 'root',
})
export class FavouriteRouteService {
    private localStorageService: LocalStorageService = inject(LocalStorageService);
    private routeService: RouteService = inject(RouteService);
    private messageService: MessageService = inject(MessageService);

    private _favourites$ = new BehaviorSubject<SelectableRoute[] | []>([]);
    readonly favourites$ = this._favourites$.asObservable();

    private _selectedFavourite$ = new BehaviorSubject<SelectableRoute | null>(null);
    selectedFavourite$ = this._selectedFavourite$.asObservable();

    readonly storageKey: string = 'favouriteRoutes';

    constructor() {
        this._favourites$.next(this.localStorageService.getItem(this.storageKey) || []);
    }

    getFavouriteRoutes(): SelectableRoute[] {
        return this._favourites$.getValue();
    }

    getSelectedFavouriteRoute(index: number): SelectableRoute {
        return this.getFavouriteRoutes()[index];
    }

    setFavouriteRoute(route: SelectableRoute): boolean {
        const previousRoutes = this.getFavouriteRoutes();

        if (previousRoutes.length > 20) {
            this.messageService.showWarning('Favourite route limit (20) reached.')
            return false;
        }

        const currentRoutes = [...previousRoutes, route];

        this.localStorageService.setItem(this.storageKey, currentRoutes);
        this._favourites$.next(currentRoutes);

        return true;
    }

    isFavouriteRoute(): boolean {
        const selectedRoute = this.routeService.getSelectedPlace();
        return this.getFavouriteRoutes().some(fav =>
            fav.originPlace?.id === selectedRoute.originPlace?.id &&
            fav.destinationPlace?.id === selectedRoute.destinationPlace?.id
        );
    }
    getFavouriteRouteIndex(): number {
        const selectedRoute = this.routeService.getSelectedPlace();
        return this.getFavouriteRoutes().findIndex(fav =>
            fav.originPlace?.id === selectedRoute.originPlace?.id &&
            fav.destinationPlace?.id === selectedRoute.destinationPlace?.id
        );
    }

    selectFavouriteRoute(index: number) {
        if (index < 0) {
            this._selectedFavourite$.next(null);
            return;
        }
        const route = this._favourites$.getValue()[index];

        this._selectedFavourite$.next({
            originPlace: route.originPlace,
            destinationPlace: route.destinationPlace
        });
    }

    reorderFavouriteRoutes(routes: SelectableRoute[]): void {
        this.localStorageService.setItem(this.storageKey, routes);
    }

    removeCurrentFavouriteRoute() {
        const selectedRoute = this.routeService.getSelectedPlace();

        const updatedFavs = this.getFavouriteRoutes().filter(fav =>
            !(fav.originPlace?.id === selectedRoute.originPlace?.id &&
                fav.destinationPlace?.id === selectedRoute.destinationPlace?.id)
        );

        this.localStorageService.setItem(this.storageKey, updatedFavs);
        this._favourites$.next(updatedFavs);
    }

    removeFavouriteRoutes(indexes: number[]) {
        const currentRoutes = [...this.getFavouriteRoutes()];

        indexes
            .sort((a, b) => b - a)
            .forEach(index => currentRoutes.splice(index, 1));
        this.localStorageService.setItem(this.storageKey, currentRoutes);
        this._favourites$.next(currentRoutes);
    }

    clearFavourites() {
        this.localStorageService.removeItem(this.storageKey);
        this._selectedFavourite$.next(null);
        this._favourites$.next([]);
    }
}