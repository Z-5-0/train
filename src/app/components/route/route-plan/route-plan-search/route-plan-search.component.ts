import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { PlaceFieldComponent } from '../../../../shared/components/autocomplete-input/place-field.component';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { RestApiService } from '../../../../services/rest-api.service';
import { Place, PlaceGroup, PlaceSearchEvent, PlaceType } from '../../../../shared/models/place';
import { PlaceApiResponse, PlaceFeature } from '../../../../shared/models/api/response-place';
import { PlaceFieldPostButton } from '../../../../shared/models/place-field-post-button';
import { Route } from '../../../../shared/models/route';
import { RouteService } from '../../../../services/route.service';
import { TRANSPORT_MODE } from '../../../../shared/constants/transport-mode';
import { GeolocationService } from '../../../../services/geolocation.service';
import { map, Subject, take, takeUntil, tap } from 'rxjs';
import { MessageService } from '../../../../services/message.service';
import { GEOLOCATION_ERROR_MESSAGE } from '../../../../shared/constants/error-geolocation';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FavouriteRouteService } from '../../../../services/favourite-route.service';
import { FavouriteTogglerComponent } from './favourite-toggle/favourite-toggler.component';
import { SearchButtonComponent } from './search-button/search-button.component';


@Component({
  selector: 'route-plan-search',
  imports: [
    CommonModule,
    PlaceFieldComponent,
    NzButtonModule,
    NzModalModule,
    FavouriteTogglerComponent,
    SearchButtonComponent,
  ],
  templateUrl: './route-plan-search.component.html',
  styleUrl: './route-plan-search.component.scss'
})
export class RoutePlanSearchComponent {
  @Output() routeOptionsChange: EventEmitter<Route[]> = new EventEmitter<Route[]>;
  @Output() routeIsLoadingChange: EventEmitter<boolean> = new EventEmitter<boolean>;

  transportMode = TRANSPORT_MODE;
  geolocationError = GEOLOCATION_ERROR_MESSAGE;

  private restApi: RestApiService = inject(RestApiService);
  private routeService: RouteService = inject(RouteService);
  private geolocationService: GeolocationService = inject(GeolocationService);
  private messageService: MessageService = inject(MessageService);
  private favouriteRouteService: FavouriteRouteService = inject(FavouriteRouteService);

  routeIsLoading: boolean = false;
  routeIsFavourite: boolean = false;
  isFavouriteChangeBlocked = signal<boolean>(false);
  originIsCurrentLocation: boolean = false;
  gpsEnabled: boolean = false;

  currentLocation = signal<string>('');
  favouriteFillStep: number = 0;

  originPlaces: PlaceGroup | null = null;
  destinationPlaces: PlaceGroup | null = null;

  originPlace = signal<Place | null>(null);
  destinationPlace = signal<Place | null>(null);

  originPlaceFieldPostButton: PlaceFieldPostButton = {} as PlaceFieldPostButton;
  destinationPlaceFieldPostButton: PlaceFieldPostButton = {} as PlaceFieldPostButton;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.setGpsStatus();
    this.loadPlaceCollection();
    this.loadSelectedPlaces();
    this.loadFavouriteSelection();
  }

  setGpsStatus() {
    navigator.geolocation.getCurrentPosition(
      () => {
        this.gpsEnabled = true;
        this.setPlaceFieldPostButtons();
      },
      (error: GeolocationPositionError) => {
        console.log('GeolocationPositionError');

        this.originPlace.set(null);
        this.gpsEnabled = false;
        this.originIsCurrentLocation = false;
        this.routeIsLoading = false;

        this.setPlaceFieldPostButtons();

        this.messageService.showWarning(this.geolocationError(error.code));
      }
    );
  }

  getGpsPosition() {
    this.originIsCurrentLocation = true;
    this.geolocationService.getCurrentLocationInfo$().subscribe(data => {
      if (!data) return;

      this.currentLocation.set(data.currentLocation);
      this.originPlace.set(data.originPlace);
      this.originPlaces = {};
      this.setPlaceFieldPostButtons();
      this.routeService.setSelectedPlace({ 'originPlace': this.originPlace() ?? null });
      this.originIsCurrentLocation = true;

      this.routeIsFavourite = this.favouriteRouteService.isFavouriteRoute();
      this.favouriteFillStep = this.routeIsFavourite ? 100 : 0;
    })
  };

  loadPlaceCollection() {
    const { originPlaces, destinationPlaces } = this.routeService.getPlaceCollection();
    this.originPlaces = originPlaces;
    this.destinationPlaces = destinationPlaces;
  }

  loadSelectedPlaces() {
    const { originPlace, destinationPlace } = this.routeService.getSelectedPlace();
    if (originPlace?.mode === 'GPS') {
      this.getGpsPosition();
    }
    this.originPlace.set(originPlace);
    this.destinationPlace.set(destinationPlace);
  }

  loadFavouriteSelection() {
    this.favouriteRouteService.selectedFavourite$
      .pipe(takeUntil(this.destroy$))
      .subscribe(selected => {
        this.originIsCurrentLocation = false;
        if (selected) {
          this.originPlace.set(selected?.originPlace ?? null)
          this.destinationPlace.set(selected?.destinationPlace ?? null);
          this.routeService.setSelectedPlace(
            {
              originPlace: this.originPlace() || null,
              destinationPlace: this.destinationPlace() ?? null
            });
          // this.originIsCurrentLocation = true;    // TODO
          // this.currentLocation.set('');
        }

        this.routeIsFavourite = this.favouriteRouteService.isFavouriteRoute();
        this.favouriteFillStep = this.routeIsFavourite ? 100 : 0;
      });
  }

  getPlaces(event: PlaceSearchEvent) {
    const { name: streamName, value } = event;

    this.restApi.getPlaces(
      {
        params: { q: value, limit: '10' },
        streamName: event.name,
        useDebounce: false,
        // debounceMs: 0,
      }
    ).pipe(
      take(1),
      map((resp: PlaceApiResponse) => this.transformPlaces(resp.features)),
      tap((placesByMode) => {
        this.routeService.setPlaceCollection(streamName, placesByMode);
        this.updatePlaceProperty(streamName, placesByMode);
      })
    ).subscribe();
  }

  onPlaceSelect(event: { name: string, field: string, place: Place }) {
    if (this.currentLocation && event.name === 'originPlace') {
      this.currentLocation.set('');
      this.originIsCurrentLocation = false;
      this.setPlaceFieldPostButtons();
    }

    if (!event.place) {
      this.routeService.setPlaceCollection(event.field, null);
    }

    (this as any)[event.name].set(event.place);

    this.routeService.setSelectedPlace({ [event.name]: event.place });

    this.favouriteRouteService.selectFavouriteRoute(-1);

    this.routeIsFavourite = this.favouriteRouteService.isFavouriteRoute();
    this.favouriteFillStep = this.routeIsFavourite ? 100 : 0;
  }

  private setPlaceFieldPostButtons() {
    this.originPlaceFieldPostButton = {
      icon: 'fa-location-crosshairs ' + (this.gpsEnabled ? 'text-success' : 'text-error'),
      disabled: !this.gpsEnabled,
      action: () => this.getGpsPosition()
    };

    this.destinationPlaceFieldPostButton = {
      icon: 'fa-retweet ' + (this.currentLocation() ? 'text-error' : 'text-success'),
      disabled: this.currentLocation() ? true : false,
      action: () => this.swapPlaces()
    }
  }

  private swapPlaces() {
    // [this.originPlace, this.destinationPlace] = [this.destinationPlace, this.originPlace];
    // [this.originPlaces, this.destinationPlaces] = [this.destinationPlaces, this.originPlaces];

    const tempOrigin = this.originPlace();
    this.originPlace.set(this.destinationPlace());
    this.destinationPlace.set(tempOrigin);

    const tempOriginPlaces = this.originPlaces;
    this.originPlaces = this.destinationPlaces;
    this.destinationPlaces = tempOriginPlaces;

    this.routeService.swapSelectedPlace();

    this.routeIsFavourite = this.favouriteRouteService.isFavouriteRoute();
    this.favouriteFillStep = this.routeIsFavourite ? 100 : 0;
  }

  private transformPlaces(data: PlaceFeature[]): Record<string, Place[]> {
    const placesByMode: Record<string, Place[]> = {};

    for (const station of data) {
      const { id, geometry, properties } = station;
      const { name, code, type, score, modes } = properties;

      modes.forEach((mode, index) => {
        if (name.includes('*')) {
          return;
        }

        if (!placesByMode[mode]) {
          placesByMode[mode] = [];
        }

        placesByMode[mode].push({
          id,
          uniqueKey: `${id}_${index}`,
          name,
          code,
          type: type as PlaceType,
          mode,
          score,
          geometry,
        });
      })
    }

    for (const mode in placesByMode) {
      placesByMode[mode].sort((a, b) => b.score - a.score);
    }

    return placesByMode;
  }

  private updatePlaceProperty(propertyName: string, value: Record<string, Place[]>): void {
    switch (propertyName) {
      case 'originPlaces':
        this.originPlaces = value;
        break;
      case 'destinationPlaces':
        this.destinationPlaces = value;
        break;
      default:
        console.warn(`Unknown place property: ${propertyName}`);    // TODO
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
