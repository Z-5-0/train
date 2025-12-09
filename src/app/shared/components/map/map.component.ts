import { Component, ElementRef, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, map, Observable, Subject, Subscription, switchMap, take, takeUntil, tap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AppSettingsService } from '../../../services/app-settings.service';
import { PathService } from '../../../services/path.service';
import { RoutePath } from '../../models/path';
import { MapTripService } from '../../../services/map-trip.service';
import { MapService } from '../../../services/map.service';
import { CurrentAppSettings } from '../../models/settings';
import { GeolocationService } from '../../../services/geolocation.service';
import { RealtimeService } from '../../../services/realtime.service';
import { TripPath } from '../../models/trip-path';
import { MapFreeService } from '../../../services/map-free.service';
import { CommonMapLayers, FreeMapLayers, TripMapLayers } from '../../models/map';

@Component({
  selector: 'map',
  imports: [
    NzButtonModule
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  @Input() mapType!: 'FREE' | 'TRIP';

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  private appSettingsService: AppSettingsService = inject(AppSettingsService);
  private pathService: PathService = inject(PathService);
  private realtimeService: RealtimeService = inject(RealtimeService);
  private mapService: MapService = inject(MapService);
  private mapTripService: MapTripService = inject(MapTripService);
  private mapFreeService: MapFreeService = inject(MapFreeService);
  private geolocationService: GeolocationService = inject(GeolocationService);

  private map!: L.Map;

  private mapType$ = new BehaviorSubject<'FREE' | 'TRIP'>('FREE');

  private currentTileLayer: L.TileLayer | null = null;

  private commonMapLayers: CommonMapLayers | null = null;
  private freeMapLayers: FreeMapLayers | null = null;
  private tripMapLayers: TripMapLayers | null = null;

  private intersectionObserverSub?: Subscription;
  private tripPollingSub: Subscription | null = null;
  private freePollingSub: Subscription | null = null;

  private freeMapInitialViewSet: boolean = false;

  private destroy$ = new Subject<void>();

  // ----- ----- COMMON ----- ----- /

  ngOnInit() {
    this.geolocationService.startTracking();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mapType']) {
      this.mapType$.next(this.mapType);
    };
  }

  ngAfterViewInit() {
    this.initMap();
    this.initCommonLayers();
    this.initIntersectionObserver();
    this.trackUserLocation();
    this.initMapEvents();
  }

  initMap() {
    this.map = this.mapService.initMap(this.mapContainer.nativeElement);
  }

  initCommonLayers() {
    this.commonMapLayers = {
      userLocation: null,
    };
  }

  initLocation() {
    return this.geolocationService.currentLocation$
      .pipe(
        takeUntil(this.destroy$),
        filter((pos): pos is { lat: number; lng: number; heading: number } => !!pos),
      )
  }

  initIntersectionObserver() {
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const isVisible = entries.some(entry => entry.isIntersecting);

      if (isVisible && !this.intersectionObserverSub) {
        this.intersectionObserverSub = combineLatest([
          this.appSettingsService.appSettings$ as Observable<CurrentAppSettings>,
          this.mapType$.pipe(distinctUntilChanged())
        ])
          .pipe(
            takeUntil(this.destroy$),
            tap(([settings]) => {
              this.updateTileLayer(settings.theme);
            }),
            tap(([, type]) => {
              this.setupMapType(type);
            })
          )
          .subscribe();
      }

      if (!isVisible && this.intersectionObserverSub) {
        this.intersectionObserverSub.unsubscribe();
        this.intersectionObserverSub = undefined;

        this.tripPollingSub?.unsubscribe();
        this.tripPollingSub = null;

        this.freePollingSub?.unsubscribe();
        this.freePollingSub = null;
      }

    }, {
      root: null,
      threshold: 0
    });

    observer.observe(this.mapContainer.nativeElement);
  }

  trackUserLocation() {
    this.initLocation()
      .pipe(takeUntil(this.destroy$))
      .subscribe(pos => this.updateUserLocationMarker(pos));
  }

  updateTileLayer(theme: number = 1) {
    if (this.currentTileLayer) this.mapService.removeLayer(this.map, this.currentTileLayer);

    this.mapService.getTile(theme).addTo(this.map);

    requestAnimationFrame(() => this.map.invalidateSize());
  }

  updateUserLocationMarker(pos: { lat: number; lng: number; heading: number }) {
    if (!this.commonMapLayers) return;

    this.commonMapLayers.userLocation = this.mapService.updateLocationMarker(
      this.map,
      this.commonMapLayers.userLocation,
      pos
    );

    if (this.mapType$.value === 'FREE' && !this.freeMapInitialViewSet) {
      this.map.setView([pos.lat, pos.lng], 16);
      this.freeMapInitialViewSet = true;
    }
  }

  setupMapType(type: 'FREE' | 'TRIP') {
    this.clearFreeMapLayers();
    this.clearTripMapLayers();

    if (type === 'FREE') {
      this.initFreeMapLayers();
      this.trackFreeMapData();
      return;
    }

    if (type === 'TRIP') {
      this.initTripMapLayers();
      this.getTripRouteData();
      this.trackTripMapData();
      return;
    }

    // TODO ERROR MESSAGE ?
  }

  initMapEvents() {
    // this.map?.on('dragstart', () => console.log('dragstart'));    // TODO LATER
    // this.map?.on('dragend', () => console.log('dragend'));    // TODO LATER

    if (!this.map) return;

    this.map.on('zoomend', () => {
      this.updateMapLabelsVisibility();
    });

    this.map.on('moveend zoomend', () => {
      this.mapFreeService.setBounds(this.map.getBounds());
    });
  }

  updateMapLabelsVisibility() {
    if (!this.map) return;

    this.mapService.updateMapLabelsVisibility(
      this.map.getZoom(),
      [
        '.map-stop-label',
        '.map-vehicle-label .name',
        '.map-vehicle-label .direction-container'
      ],
      [
        { display: ['none', 'grid'] }
      ]
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    this.mapTripService.saveMapState({
      center: this.map.getCenter(),
      zoom: this.map.getZoom()
    });

    if (this.map) {
      this.map.off();
      this.map.remove();
    }

    this.geolocationService.stopTracking();
  }

  // -------------------- FREE MAP --------------------

  initFreeMapLayers() {
    if (!this.map) return;    // TODO ERROR MESSAGE ?
    this.clearFreeMapLayers();

    this.freeMapLayers = {
      vehicles: L.layerGroup(),
    };

    this.freeMapLayers.vehicles.addTo(this.map);
  }

  trackFreeMapData() {
    this.freePollingSub?.unsubscribe();
    this.freePollingSub = null;

    this.freePollingSub = this.appSettingsService.appSettings$
      .pipe(
        map(settings => !!(settings as CurrentAppSettings).autoUpdate),
        switchMap(autoUpdate =>
          autoUpdate
            ? this.mapFreeService.startFreeMapDataPolling()
            : this.mapFreeService.freeMapBounds$.pipe(
              filter(bounds => !!bounds),
              switchMap(bounds => this.mapFreeService.getFreeMapData(bounds!))
            )
        ),
        tap(data => this.updateFreeMapData(data)),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  updateFreeMapData(data: any) {
    if (!data || !this.freeMapLayers) return;

    this.mapService.updateTransportLayer(this.freeMapLayers.vehicles, data || []);

    this.updateMapLabelsVisibility();
  }

  clearFreeMapLayers() {
    if (!this.freeMapLayers) return;

    Object.values(this.freeMapLayers).forEach(group => {
      group.clearLayers();
      this.map.removeLayer(group);
    });

    this.freeMapLayers = null;
  }

  // -------------------- TRIP MAP --------------------

  initTripMapLayers() {
    if (!this.map) return;    // TODO ERROR MESSAGE ?
    this.clearTripMapLayers();

    this.tripMapLayers = {
      route: L.featureGroup(),
      stops: {
        intermediate: L.layerGroup(),
        boarding: L.layerGroup()
      },
      vehicles: L.layerGroup(),
    };

    this.tripMapLayers.route.addTo(this.map);
    this.tripMapLayers.stops.intermediate.addTo(this.map);
    this.tripMapLayers.stops.boarding.addTo(this.map);
    this.tripMapLayers.vehicles.addTo(this.map);
  }

  getTripRouteData() {
    this.pathService.routePath$
      .pipe(
        filter(route => !!route),
        take(1)
      ).subscribe(route => {
        this.initTripMap(route!);
      });
  }

  initTripMap(route: RoutePath) {
    if (!this.tripMapLayers) return;

    this.mapTripService.drawRouteGeometry(this.tripMapLayers.route, route.sequences);
    this.mapTripService.drawIntermediateStops(this.tripMapLayers!.stops.intermediate, route.sequences);

    const allPoints = route.sequences.flatMap(s => s.sequenceGeometry.points);

    const mapState = this.mapTripService.getMapState();

    if (mapState) this.map.setView([mapState.center.lat, mapState.center.lng], mapState.zoom);
    if (!mapState) this.mapService.fitBounds(this.map, allPoints);

    this.updateMapLabelsVisibility();
  }

  trackTripMapData() {
    this.tripPollingSub?.unsubscribe();
    this.tripPollingSub = null;

    this.tripPollingSub = this.appSettingsService.appSettings$
      .pipe(
        map(settings => !!settings['autoUpdate']),
        switchMap(autoUpdate =>
          autoUpdate
            ? this.realtimeService.startRealtimeDataPolling()
            : this.realtimeService.getRealtimeData()
        ),
        tap(data => this.updateTripMapData(data)),    // this.updateMapLabelsVisibility(); ?
      )
      .subscribe();
  }

  updateTripMapData(data: TripPath) {
    if (!data || !this.tripMapLayers) return;

    this.mapTripService.updateTripOriginsLayer(this.tripMapLayers.stops.boarding, data.originData || []);
    this.mapService.updateTransportLayer(this.tripMapLayers.vehicles, data.transportData || []);

    this.updateMapLabelsVisibility();
  }

  clearTripMapLayers() {
    if (!this.tripMapLayers) return;

    this.map.removeLayer(this.tripMapLayers.route);
    this.map.removeLayer(this.tripMapLayers.vehicles);
    this.map.removeLayer(this.tripMapLayers.stops.intermediate);
    this.map.removeLayer(this.tripMapLayers.stops.boarding);

    this.tripMapLayers = null;
  }
}
