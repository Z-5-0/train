import { Component, ElementRef, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { BehaviorSubject, combineLatest, filter, map, Observable, Subject, Subscription, switchMap, takeUntil, tap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AppSettingsService } from '../../../services/app-settings.service';
import { PathService } from '../../../services/path.service';
import { RoutePath, RoutePathSequence } from '../../models/path';
import { MapTripService } from '../../../services/map-trip.service';
import { MapService } from '../../../services/map.service';
import { MapMode } from '../../models/map';
import { CurrentAppSettings } from '../../models/settings';
import { GeolocationService } from '../../../services/geolocation.service';
import { RealtimeService } from '../../../services/realtime.service';
import { TripPath, TripPathOriginData, TripPathTransportData } from '../../models/trip-path';

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
  private geolocationService: GeolocationService = inject(GeolocationService);

  private map!: L.Map;

  private mapType$ = new BehaviorSubject<'FREE' | 'TRIP'>('FREE');

  private currentTileLayer: L.TileLayer | null = null;
  private freeMapLayers: L.Layer | null = null;
  public tripMapLayers: L.LayerGroup | null = null;
  public tripOriginLayers: L.LayerGroup | null = null;
  private transportLocationLayers: L.LayerGroup | null = null;
  private locationMarker: L.Marker | null = null;

  private intersectionObserverSub?: Subscription;

  private destroy$ = new Subject<void>();

  // ----- ----- COMMON ----- ----- /

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mapType']) {
      this.mapType$.next(this.mapType);
    }
  }

  ngAfterViewInit() {
    this.initMap();

    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      const isVisible = entries.some((entry: IntersectionObserverEntry) => {
        return entry.isIntersecting
      });

      if (isVisible && !this.intersectionObserverSub) {   // If map visible
        this.intersectionObserverSub = combineLatest([
          this.appSettingsService.appSettings$ as Observable<CurrentAppSettings>,
          this.mapType$
        ])
          .pipe(
            tap(([settings, type]: [CurrentAppSettings, MapMode]) => {    // Probably not the best solution inside tap
              this.updateTileLayer(settings['theme']);

              if (!this.tripOriginLayers) {
                this.updateMapContent(type);
              }
            })
          )
          .subscribe();
      }

      if (!isVisible && this.intersectionObserverSub) {   // Unsubscribe when map not visible
        this.intersectionObserverSub.unsubscribe();
        this.intersectionObserverSub = undefined;
      }
    }, {
      root: null,
      threshold: 0
    });

    observer.observe(this.mapContainer.nativeElement);
  }

  initMap() {
    this.map = this.mapService.initMap(this.mapContainer.nativeElement);
  }

  updateMapContent(type: 'FREE' | 'TRIP') {
    if (this.freeMapLayers) {
      this.map.removeLayer(this.freeMapLayers);
      this.freeMapLayers = null;
    }
    if (this.tripMapLayers && this.tripOriginLayers) {
      this.mapService.removeLayer(this.map, this.tripMapLayers);
      this.mapService.removeLayer(this.map, this.tripOriginLayers);
      this.tripMapLayers = null;
    }

    if (type === 'FREE') {
      this.freeMapLayers = L.circle([47.4979, 19.0402], {   // TODO LATER...
        color: 'red',
        radius: 500
      }).addTo(this.map);
    }

    if (type === 'TRIP') {
      this.initRoutePath()
        .pipe(takeUntil(this.destroy$))
        .subscribe((routePath: RoutePath | null) => {
          this.initTripMap(routePath);
          this.initRealtimeData();
          this.initLocation();
          this.updateMapLabelsVisibility();
        });
    }

    this.initMapEvents();
  }

  updateTileLayer(theme: number = 1) {
    if (this.currentTileLayer) this.mapService.removeLayer(this.map, this.currentTileLayer);

    this.mapService.getTile(theme).addTo(this.map);

    requestAnimationFrame(() => this.map.invalidateSize());
  }

  updateMapLabelsVisibility() {
    this.mapService.updateMapLabelsVisibility(
      this.map?.getZoom(),
      [
        '.map-stop-label',
        '.map-vehicle-label .name',
        '.map-vehicle-label .direction-container'
      ],
      [
        { 'display': ['none', 'grid'] }
      ]
    );
  }

  initLocation() {
    this.geolocationService.startTracking();

    this.geolocationService.currentLocation$
      .pipe(
        takeUntil(this.destroy$),
        filter((pos): pos is { lat: number; lng: number; heading: number } => !!pos),
        tap((pos) => {
          this.locationMarker = this.mapTripService.updateLocationMarker(
            this.map,
            this.locationMarker,
            pos
          );
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.off();
      this.map.remove();
    }

    this.geolocationService.stopTracking();
  }

  // ----- ----- TRIP ----- ----- /

  initTripMap(selectedPath: RoutePath | null) {
    if (!selectedPath) return;

    if (this.tripOriginLayers) {
      this.map.removeLayer(this.tripOriginLayers);
      this.tripOriginLayers = this.mapService.addLayer(this.map);

      this.updateMapLabelsVisibility();

      return;
    }

    this.tripMapLayers = this.mapService.addLayer(this.map);
    this.tripOriginLayers = this.mapService.addLayer(this.map);

    this.tripMapLayers = this.mapTripService.createTripLayers(this.tripMapLayers, selectedPath.sequences);

    const allPoints = selectedPath.sequences.flatMap((seq: RoutePathSequence) => seq.sequenceGeometry.points);

    this.mapService.fitBounds(this.map, allPoints);

    this.updateMapLabelsVisibility();
  }

  initMapEvents() {
    // this.map?.on('dragstart', () => console.log('dragstart'));    // TODO LATER
    // this.map?.on('dragend', () => console.log('dragend'));    // TODO LATER

    this.map?.on('zoomend', () => {
      this.updateMapLabelsVisibility();
    });
  }

  initRoutePath(): Observable<RoutePath | null> {
    return this.pathService.routePath$;
  }

  initRealtimeData() {
    this.appSettingsService.appSettings$
      .pipe(
        map(settings => !!(settings as CurrentAppSettings)['autoUpdate']),
        switchMap((autoUpdate: boolean) =>
          autoUpdate
            ? this.realtimeService.startRealtimeDataPolling()
            : this.realtimeService.getRealtimeData(),
        ),
        tap((data: TripPath) => this.updateOriginLayers(data?.originData || [])),
        tap((data: TripPath) => this.updateTransportLocation(data?.transportData || [])),
        tap(() => this.updateMapLabelsVisibility()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  updateOriginLayers(originData: TripPathOriginData[] | null) {
    this.mapTripService.updateTripOriginsLayer(this.tripOriginLayers, originData || []);
  }

  updateTransportLocation(transportLocations: TripPathTransportData[]) {
    if (this.transportLocationLayers) this.mapService.removeLayer(this.map, this.transportLocationLayers);
    this.transportLocationLayers = this.mapService.addLayer(this.map);
    this.mapTripService.updateTransportLayer(this.transportLocationLayers, transportLocations);
    return;
  }

  // ----- ----- FREE ----- ----- /

  initFreeMap() {
    console.log('init FREE map');

    const circle = L.circle([47.497913, 19.040236], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500
    }).addTo(this.map);
  }
}
