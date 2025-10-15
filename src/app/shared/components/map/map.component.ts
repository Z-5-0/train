import { Component, ElementRef, inject, Input, SimpleChanges, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { RestApiService } from '../../../services/rest-api.service';
import { createPlanQuery } from '../../constants/query/plan-query';
import { BehaviorSubject, catchError, combineLatest, distinctUntilChanged, filter, map, Observable, of, Subject, Subscription, switchMap, takeUntil, tap, throwError } from 'rxjs';
import { VEHICLE_POSITION_QUERY } from '../../constants/query/vehicle-location-query';
import { ROUTE_PATH_QUERY } from '../../constants/query/route-path-query';
import { RouteService } from '../../../services/route.service';
import { DateTime } from 'luxon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { AppSettingsService } from '../../../services/app-settings.service';
import { TRANSPORT_MODE } from '../../constants/transport-mode';
import { PathService } from '../../../services/path.service';
import { IntermediateStop, RoutePath, RoutePathSequence } from '../../models/path';
import { ActiveMap, MapMode } from '../../models/map';
import { MapService } from '../../../services/map.service';
import { AppSettings, CurrentAppSettings } from '../../models/settings';
import { MapModeAction } from '../../constants/map';

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

  private restApi: RestApiService = inject(RestApiService);
  private routeService: RouteService = inject(RouteService);
  private appSettingsService: AppSettingsService = inject(AppSettingsService);
  private pathService: PathService = inject(PathService);
  private mapService: MapService = inject(MapService);

  private mapMode!: MapMode;

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  map!: L.Map;
  protected mapId: string = '';

  private locationMarker: L.Marker | null = null;
  private stopLabels: HTMLElement[] = [];

  destroy$ = new Subject<void>();

  tileTheme: { image: string; attribution: string }[] = [
    {
      image: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    {
      image: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  ];

  private mapType$ = new BehaviorSubject<'FREE' | 'TRIP'>('FREE');

  private freeLayer: L.Layer | null = null;
  private tripLayers: L.LayerGroup | null = null;
  private statusLayers: L.LayerGroup | null = null;

  private currentTileLayer: L.TileLayer | null = null;

  private intersectionObserverSub?: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['mapType']) {
      this.mapType$.next(this.mapType);
    }
  }

  ngAfterViewInit() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [47.4979, 19.0402],
      zoom: 13,
      zoomControl: false,
    });

    const observer = new IntersectionObserver((entries) => {
      const isVisible = entries.some(e => e.isIntersecting);

      // Ha látható a térkép
      if (isVisible && !this.intersectionObserverSub) {
        console.log('Map visible → subscribing');

        this.intersectionObserverSub = combineLatest([
          this.appSettingsService.appSettings$,
          this.mapType$
        ])
          .pipe(
            tap(([settings, type]) => {
              this.updateTileLayer(settings['theme']);
              this.updateMapContent(type);
            })
          )
          .subscribe();
      }

      // Ha nem látható → leiratkozunk, ha volt subscription
      if (!isVisible && this.intersectionObserverSub) {
        console.log('Map hidden → unsubscribed');
        this.intersectionObserverSub.unsubscribe();
        this.intersectionObserverSub = undefined;
      }
    }, {
      root: null,
      threshold: 0.1 // csak ha ténylegesen eltűnik/látszik
    });

    observer.observe(this.mapContainer.nativeElement);
  }


  private updateMapContent(type: 'FREE' | 'TRIP') {
    if (this.freeLayer) {
      this.map.removeLayer(this.freeLayer);
      this.freeLayer = null;
    }
    if (this.tripLayers && this.statusLayers) {
      this.map.removeLayer(this.tripLayers);
      // this.map.removeLayer(this.statusLayers);
      this.tripLayers = null;
      // this.statusLayers = null;
    }

    if (type === 'FREE') {
      console.log('🎯 FREE map init');
      this.freeLayer = L.circle([47.4979, 19.0402], {
        color: 'red',
        radius: 500
      }).addTo(this.map);
    }

    if (type === 'TRIP') {
      console.log('🎯 TRIP map init');

      // this.tripLayers = L.layerGroup().addTo(this.map);
      // this.statusLayers = L.layerGroup().addTo(this.map);

      this.initRoutePath()
        .pipe(takeUntil(this.destroy$))
        .subscribe(routePath => {
          console.log('RoutePath frissítve:', routePath);
          this.initMapTrip(routePath);
        });

    }
  }

  updateTileLayer(theme: number = 1) {
    if (this.currentTileLayer) {
      this.map.removeLayer(this.currentTileLayer);
    }

    this.currentTileLayer = L.tileLayer(
      this.tileTheme[theme].image,
      {
        minZoom: -1,
        maxZoom: 20,
        attribution: this.tileTheme[theme].attribution,
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 2
      }
    ).addTo(this.map);

    requestAnimationFrame(() => this.map.invalidateSize());
  }

  initMap() {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [47.497913, 19.040236],
      zoom: 13
    });

    return;
  }

  initMapEvents() {
    this.map?.on('dragstart', () => console.log('dragstart'));
    this.map?.on('dragend', () => console.log('dragend'));

    this.map?.on('zoomend', () => {
      const zoom = this.map?.getZoom() || 0;    // TODO || 0
      // this.stopLabels = Array.from(document.querySelectorAll('.map-stop-label')) as HTMLElement[];
      document.querySelectorAll('.map-stop-label').forEach((el) => {
        const span = el as HTMLElement;
        if (zoom < 14) {
          span.style.display = 'none';
        } else {
          span.style.display = 'grid';
          const fontSize = 4 + (zoom - 12) * 2;
          span.style.fontSize = `${fontSize}px`;
        }
      });
    });
  }

  initRoutePath(): Observable<RoutePath | null> {
    return this.appSettingsService.appSettings$.pipe(
      map(settings => !!settings['autoUpdate']),
      switchMap(autoUpdate =>
        autoUpdate
          ? this.pathService.getRoutePathPolling()
          : this.pathService.getRoutePath()
      )
    );
  }

  initMapTrip(selectedPath: any) {


    return;
    if (!selectedPath) return;

    if (this.statusLayers) {
      // this.map.removeLayer(this.statusLayers);
      this.statusLayers = L.layerGroup().addTo(this.map);

      selectedPath.sequences.forEach((seq: any) => {
        this.addStatuses(seq);
      });
      return;
    }

    this.tripLayers = L.layerGroup().addTo(this.map);
    this.statusLayers = L.layerGroup().addTo(this.map);

    selectedPath.sequences.forEach((seq: any) => {
      this.addPolyline(seq);
      this.addMarkers(seq);
      this.addIntermediateStops(seq);
      this.addStatuses(seq);
    });

    const allPoints = selectedPath.sequences.flatMap((seq: any) => seq.sequenceGeometry.points);

    this.mapService.fitBounds(this.map, allPoints);
  }

  initFreeMap() {
    console.log('init FREE map');

    const circle = L.circle([47.497913, 19.040236], {
      color: 'red',
      fillColor: '#f03',
      fillOpacity: 0.5,
      radius: 500
    }).addTo(this.map);
  }

  addPolyline(seq: RoutePathSequence) {
    this.tripLayers?.addLayer(this.mapService.drawPolyline(
      seq.sequenceGeometry.points,
      seq.modeData.color,
      3,
      'map-trip-polyline'
    ));
  }

  addMarkers(seq: RoutePathSequence) {
    this.tripLayers?.addLayer(this.mapService.drawCircleMarker(
      [seq.to.lat, seq.to.lon]
    ));

    this.tripLayers?.addLayer(this.mapService.drawCircleMarker(
      [seq.from.lat, seq.from.lon],
      '#000000',
      false,
      1,
      '',
      2,
      6
    ));

    this.tripLayers?.addLayer(this.mapService.drawDivIcon(
      [seq.to.lat, seq.to.lon],
      seq.modeData.color,
      seq.to.name,
      '',
      seq.delayedStartTime,
      'map-stop-label'
    ));
  }

  addIntermediateStops(seq: RoutePathSequence) {
    seq.intermediateStops?.forEach((stop: IntermediateStop) => {
      this.tripLayers?.addLayer(this.mapService.drawCircleMarker(
        [stop.geometry.coordinates[0], stop.geometry.coordinates[1]],
        seq.modeData.color,
        true,
        0,
        seq.modeData.color,
        2,
        5
      ));

      this.tripLayers?.addLayer(this.mapService.drawDivIcon(
        [stop.geometry.coordinates[0], stop.geometry.coordinates[1]],
        seq.modeData.color,
        stop.name,
        '',
        '',
        'map-stop-label'
      ));
    });
  }

  addStatuses(seq: RoutePathSequence) {
    this.statusLayers?.addLayer(this.mapService.drawDivIcon(
      [seq.from.lat, seq.from.lon],
      seq.modeData.color,
      seq.from.name,
      seq.status,
      seq.delayedStartTime,
      'map-stop-label'
    ));
  }

  // ----------------------------------------------- //

  getLocation() {   // TODO
    const location = this.map?.locate({}).on('locationfound', (e: L.LocationEvent) => {
      console.log('Latitude:', e.latlng.lat);
      console.log('Longitude:', e.latlng.lng);
    });

    navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const rawHeading = position.coords.heading; // lehet null
        const heading = (rawHeading !== null && rawHeading !== undefined ? rawHeading : 0) - 45;


        // Ha már létezik marker, frissítjük
        if (this.locationMarker) {
          this.locationMarker.setLatLng([lat, lng]);
          const icon = this.locationMarker.getIcon() as L.DivIcon;
          icon.options.html = `<i class="fa-solid fa-location-arrow" style="color: red; transform: rotate(${heading}deg); font-size: 24px;"></i>`;
          this.locationMarker.setIcon(icon);
        } else {
          // Új marker létrehozása
          const userIcon = L.divIcon({
            className: 'user-marker',
            html: `<i class="fa-solid fa-location-arrow" style="color: red; transform: rotate(${heading}deg); font-size: 24px;"></i>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          if (this.map) {
            this.locationMarker = L.marker([lat, lng], { icon: userIcon }).addTo(this.map);
          }
        }
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );

    this.map?.locate({ setView: true });
  }

  getVehiclePosition() {
    const variables = {
      trips: [
        { id: "BKK:D032858681", serviceDay: DateTime.now().toUTC().startOf('day').toMillis() },
        // { id: "1:003609100_0", serviceDay: DateTime.now().toUTC().startOf('day').toMillis() },
      ]
    };

    this.restApi.getVehiclePosition({
      body: {
        query: VEHICLE_POSITION_QUERY,
        variables: variables
      },
      debounceTime: false
    }).pipe(
      map((response: any) => response),
      tap(resp => console.log('Vehicle position: ', resp)),
      catchError(err => {     // does not run due to retry in rest-api service
        // return EMPTY;
        return throwError(() => err);       // pushes error towards components
      })
    ).subscribe();
  }

  ngOnDestroy() {
    console.log('MAP DESTROYED');

    this.destroy$.next();
    this.destroy$.complete();

    if (this.map) {
      this.map.off();
      this.map.remove();
    }
  }
}
