import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output, signal, WritableSignal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { Place } from '../../../../../shared/models/place';
import { RouteService } from '../../../../../services/route.service';
import { RestApiService } from '../../../../../services/rest-api.service';
import { ROUTE_QUERY } from '../../../../../shared/constants/query/route-query';
import { DateTime, Duration } from 'luxon';
import { TRANSPORT_MODE } from '../../../../../shared/constants/transport-mode';
import { finalize, map, take, tap } from 'rxjs';
import { IntermediateStop, Itinerary, Leg, RouteApiResponse } from '../../../../../shared/models/api/response-route';
import { PointGeometry, TransportMode } from '../../../../../shared/models/common';
import { Route, RouteSequence } from '../../../../../shared/models/route';
import { AppSettingsService } from '../../../../../services/app-settings.service';
import polyline from '@mapbox/polyline';
import { GraphQLErrorService } from '../../../../../services/graphql-error.service';

@Component({
  selector: 'search-button',
  imports: [
    CommonModule,
    NzButtonModule,
  ],
  templateUrl: './search-button.component.html',
  styleUrl: './search-button.component.scss',
  standalone: true
})
export class SearchButtonComponent {
  @Input() originPlace: WritableSignal<Place | null> = signal<Place | null>(null);
  @Input() destinationPlace: WritableSignal<Place | null> = signal<Place | null>(null);
  @Input() currentLocation = signal<string>('');
  @Input() loading: boolean = false;

  @Output() optionsChange: EventEmitter<Route[]> = new EventEmitter<Route[]>;
  @Output() loadingChange: EventEmitter<boolean> = new EventEmitter<boolean>;

  private restApi: RestApiService = inject(RestApiService);
  private routeService: RouteService = inject(RouteService);
  private appSettingsService: AppSettingsService = inject(AppSettingsService);
  private graphQLErrorService: GraphQLErrorService = inject(GraphQLErrorService);

  routeQuery = ROUTE_QUERY;
  transportMode = TRANSPORT_MODE;

  numberOfItineraries!: number;
  walkSpeed!: number;

  ngOnInit() {
    this.appSettingsService.appSettings$.subscribe(settings => {
      this.numberOfItineraries = settings['alternativeRoutes'];
      this.walkSpeed = settings['walkSpeed'];
    });
  }

  getRoute() {
    this.loading = true;
    this.loadingChange.emit(true);
    this.routeService.setSelectedRoute(null);

    this.restApi.getRoute({
      body: {
        query: this.routeQuery,
        variables: {
          numItineraries: this.numberOfItineraries,
          fromPlace: this.currentLocation() || `${this.originPlace()?.name}::${this.originPlace()?.id}`,
          toPlace: `${this.destinationPlace()?.name}::${this.destinationPlace()?.id}`,
          date: DateTime.now().toFormat('yyyy-LL-dd HH:mm').split(' ')[0],
          time: DateTime.now().toFormat('yyyy-LL-dd HH:mm').split(' ')[1],
          // modes: Object.entries(this.transportMode).map(([key]) => ({ mode: key })).slice(0, -2),
          modes: Object.keys(TRANSPORT_MODE)
            .filter(mode => !['GPS', 'ERROR'].includes(mode))
            .map(includedMode => {    // .map(mode => ({ mode }))
              return { mode: includedMode }
            }),
          distributionChannel: "ERTEKESITESI_CSATORNA#INTERNET",
          distributionSubChannel: "ERTEKESITESI_ALCSATORNA#EMMA",
          walkSpeed: this.walkSpeed / 3.6,
          minTransferTime: 0,
          arriveBy: false,
          transitPassFilter: [],
          comfortLevels: [],
          searchParameters: [],
          banned: {}
        }
      },
      useDebounce: false
    }).pipe(
      take(1),
      tap((response: RouteApiResponse) => this.graphQLErrorService.handleErrors('getRoute', response)),
      map((response: RouteApiResponse) => {
        return this.transformRouteResponse(response.data.plan.itineraries);
      }),
      tap((routes: Route[]) => {
        this.optionsChange.emit(routes);
        this.routeService.setRouteOptions(routes);
      }),
      finalize(() => {
        this.loading = false;
        this.loadingChange.emit(false);
      })
    ).subscribe();
  }

  private transformRouteResponse(itineraries: Itinerary[]): Route[] {
    return itineraries.map((itinerary, index) => ({
      index,
      numberOfTransfers: itinerary.numberOfTransfers,
      duration: Math.ceil(Duration.fromObject({ seconds: itinerary.duration ?? 0 }).as('minutes')),
      startTime: itinerary.startTime
        ? DateTime.fromMillis(itinerary.startTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
        : '--:--',
      startTimestamp: itinerary.startTime ?? 0,
      endTime: itinerary.endTime
        ? DateTime.fromMillis(itinerary.endTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
        : '--:--',
      endTimeTimestamp: itinerary.endTime ?? 0,
      walkTime: Math.ceil(Duration.fromObject({ seconds: itinerary.walkTime ?? 0 }).as('minutes')),
      walkTimeInSeconds: itinerary.walkTime ?? 0,
      waitingTime: Math.ceil(Duration.fromObject({ seconds: itinerary.waitingTime ?? 0 }).as('minutes')),
      sequences: (itinerary.legs ?? []).map(leg => this.transformLeg(leg))
    }));
  }

  private transformLeg(leg: Leg): RouteSequence {
    return {
      realTime: leg.realTime ?? false,
      mode: (leg.mode ?? 'ERROR') as TransportMode,
      origin: {
        gtfsId: leg.from.stop?.gtfsId ?? '',
        name: leg.from.name ?? '',
        geometry: { type: 'Point', coordinates: [leg.from.lat ?? 0, leg.from.lon ?? 0] } as PointGeometry,
        scheduledStartTime: leg.realTime
          ? DateTime.fromMillis(leg.startTime - leg.departureDelay * 1000, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
          : DateTime.fromMillis(leg.startTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
        /* scheduledStartTime: DateTime.fromMillis(leg.startTime - (leg.realTime ? leg.departureDelay * 1000 : 0), { zone: 'utc' })
          .setZone('Europe/Budapest').toFormat('HH:mm'), */
        delayedStartTime: leg.realTime
          ? DateTime.fromMillis(leg.startTime, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm')
          : DateTime.fromMillis(leg.startTime + leg.departureDelay * 1000, { zone: 'utc' }).setZone('Europe/Budapest').toFormat('HH:mm'),
        /* delayedStartTime: DateTime.fromMillis(leg.startTime, { zone: 'utc' })
          .setZone('Europe/Budapest').toFormat('HH:mm'), */
        departureDelay: (leg.departureDelay > 0)
          ? Math.floor(Math.abs(Duration.fromObject({ seconds: leg.departureDelay }).as('minutes')))
          : Math.ceil(Math.abs(Duration.fromObject({ seconds: leg.departureDelay }).as('minutes'))),
        status: leg.mode !== 'WALK'
          ? (
            leg.departureDelay < 0
              ? 'early'
              : leg.departureDelay < 60
                ? 'on time'
                : 'late'
          ) as 'early' | 'on time' | 'late'
          : null
      },
      destination: {
        gtfsId: leg.to.stop?.gtfsId ?? '',
        name: leg.to.name ?? '',
        geometry: { type: 'Point', coordinates: [leg.to.lat ?? 0, leg.to.lon ?? 0] } as PointGeometry
      },
      transportInfo: {
        id: leg.trip?.id ?? '',
        gtfsId: leg.trip?.gtfsId ?? '',
        headSign: leg.trip?.tripHeadsign ?? '',
        name: leg.trip?.tripShortName?.replace(/\s+/g, ' ').trim() ?? '',
        shortName: leg.mode !== 'WALK' && (this.transportMode[leg.mode].name === 'shortName' || this.transportMode[leg.mode].name === 'longName')
          ? leg.route?.[this.transportMode[leg.mode].name as 'shortName' | 'longName']?.replace(/\s/g, "")?.slice(0, 5) ?? null
          : null,
        longName: leg.mode !== 'WALK' && (this.transportMode[leg.mode].name === 'shortName' || this.transportMode[leg.mode].name === 'longName')
          ? leg.route?.[this.transportMode[leg.mode].name as 'shortName' | 'longName']?.split(/[\/-]/)[0] ?? null
          : null,
        textColor: leg.route?.textColor ? `#${leg.route?.textColor}` : null,
        backgroundColor: leg.route?.color ? `#${leg.route?.color}` : null
      },
      stops: [
        {
          id: leg.from.stop?.id ?? '',
          gtfsId: leg.from.stop?.gtfsId ?? '',
          name: leg.from.name ?? '',
          geometry: { type: 'Point', coordinates: [leg.from.lat ?? 0, leg.from.lon ?? 0] } as PointGeometry,
        },
        ...(leg.intermediateStops ?? []).map((stop: IntermediateStop) => ({
          id: stop.id ?? '',
          gtfsId: stop.gtfsId ?? '',
          name: stop.name ?? '',
          geometry: { type: 'Point', coordinates: [stop.lat ?? 0, stop.lon ?? 0] } as PointGeometry,
        })),
        {
          id: leg.to.stop?.id ?? '',
          gtfsId: leg.to.stop?.gtfsId ?? '',
          name: leg.to.name ?? '',
          geometry: { type: 'Point', coordinates: [leg.to.lat ?? 0, leg.to.lon ?? 0] } as PointGeometry
        }
      ],
      sequenceGeometry: {
        length: leg.legGeometry?.length ?? 0,
        points: leg.legGeometry?.points ? polyline.decode(leg.legGeometry.points) as [number, number][] : []
      }
    }
  }
}
