import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, NgZone, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DateTime } from 'luxon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { BehaviorSubject, catchError, EMPTY, filter, map, merge, Observable, pairwise, startWith, Subject, Subscription, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs';
import { AppSettingsService } from '../../../services/app-settings.service';
import { RestApiService } from '../../../services/rest-api.service';
import { RouteService } from '../../../services/route.service';
import { TripService } from '../../../services/trip.service';
import { TRANSPORT_MODE } from '../../../shared/constants/transport-mode';
import { TRIP_ALERT } from '../../../shared/constants/trip-alert';
import { Route, RouteSequence, TransportInfo } from '../../../shared/models/route';
import { CurrentTrip, StopTime } from '../../../shared/models/trip';
import { KmPipe } from '../../../shared/pipes/km.pipe';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html-pipe';
import { StopStatusPipe } from '../../../shared/pipes/stop-status.pipe';


@Component({
  selector: 'route-transit',
  imports: [
    CommonModule,
    FormsModule,
    NzBadgeModule,
    NzTabsModule,
    NzTimelineModule,
    NzIconModule,
    KmPipe,
    NzSegmentedModule,
    NzProgressModule,
    NzCardModule,
    SafeHtmlPipe,
    StopStatusPipe,
    NzSpinModule
  ],
  templateUrl: './route-transit.component.html',
  styleUrl: './route-transit.component.scss'
})
export class RouteTransitComponent {
  @ViewChild('transportCurrentPosition') transportCurrentPosition!: ElementRef<HTMLDivElement>;
  // @ViewChild('infoTabContainer') infoTabContainer!: ElementRef<HTMLDivElement>;
  // @ViewChildren('stopToScroll') stopToScroll!: QueryList<HTMLDivElement>;

  ngZone: NgZone = inject(NgZone);

  routeOptions: Route[] | null = null;

  restApi: RestApiService = inject(RestApiService);
  routeService: RouteService = inject(RouteService);
  tripService: TripService = inject(TripService);
  appSettingsService: AppSettingsService = inject(AppSettingsService);

  public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;
  public tripAlert = TRIP_ALERT;

  currentRoute: Route | null = null;
  currentSequences: RouteSequence[] = [];
  currentTrip: CurrentTrip = {} as CurrentTrip;
  public currentTrip$ = new BehaviorSubject<CurrentTrip | null>(null);
  currentOriginStop: StopTime | undefined = { station: { isPassed: false } } as StopTime;
  currentDestinationStop: StopTime = { station: { isArrived: false } } as StopTime;

  selectedTransit: number = 0;

  autoUpdate: boolean = true;

  selectedTransit$ = new BehaviorSubject<number>(0);
  tripSubscription?: Subscription;
  destroy$ = new Subject<void>();

  private tripDestroy$ = new Subject<void>();

  tripIsLoading: boolean = false;

  currentTransitDataTabIndex: number = 0;

  ngOnInit() {
    this.initCurrentRoute();
    this.initTripStream();
  }

  private initCurrentRoute() {
    this.routeService.selectedRoute$.pipe(
      filter(route => !!route),   // OR filter(Boolean)
      take(1)
    ).subscribe(route => {
      this.currentRoute = route!;
      this.currentSequences = route!.sequences;

      this.selectedTransit = this.findFirstNonWalkTransit();

      this.selectedTransit$.next(this.selectedTransit);
    });
  }

  private initTripStream() {
    this.tripDestroy$ = new Subject<void>();

    /* const trip$ = this.selectedTransit$.pipe(
      filter(() => !!this.currentRoute),
      startWith(this.selectedTransit),
      tap(() => this.tripIsLoading = true),
      switchMap(transit => this.getTripObservable(transit, this.tripDestroy$)),
      takeWhile(trip => this.evaluateTripStatus(trip))
    ); */

    const trip$ = this.selectedTransit$.pipe(
      filter(() => !!this.currentRoute),
      startWith(this.selectedTransit),
      tap(() => this.tripIsLoading = true),
      switchMap(transit =>
        this.getTripObservable(transit, this.tripDestroy$).pipe(
          takeWhile(trip => this.evaluateTripStatus(trip), true),
          catchError(() => EMPTY)   // in case of error
        )
      )
    );

    trip$.pipe(
      startWith(null),
      pairwise(),
      tap(([prev, curr]) => {
        if (prev?.gtfsId !== curr?.gtfsId) {
          this.ngZone.onStable.pipe(take(1)).subscribe(() => this.onTabChange());
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe();

    this.tripSubscription = merge(
      trip$,
      this.restApi.errorNotification$.pipe(tap(() => this.tripIsLoading = false))
    ).pipe(takeUntil(this.destroy$))
      .subscribe(trip => {
        if (trip && 'gtfsId' in trip) {
          this.updateStopState(trip as CurrentTrip);
          this.markTripStops();
          this.tripIsLoading = false;
        }
      });
  }

  private getTripObservable(selectedTransit: number, destroy: any): Observable<CurrentTrip> {
    if (!this.currentRoute) return EMPTY;

    const gtfsId = this.currentRoute.sequences[selectedTransit]?.transportInfo?.gtfsId ?? null;
    if (!gtfsId) return EMPTY;

    return this.appSettingsService.appSettings$.pipe(
      map(settings => !!settings['autoUpdate']),
      switchMap(autoUpdate =>
        autoUpdate
          ? this.tripService.getTripPolling(gtfsId)
          : this.tripService.getTrip(gtfsId)
      )
    );
  }

  onTabIndexChange(index: number): void {
    this.currentTransitDataTabIndex = index;
    this.onTabChange();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    this.tripDestroy$.next();
    this.tripDestroy$.complete();

    this.tripSubscription?.unsubscribe();
  }

  // --------------------------------------------------------------------------------------------------------------------------------

  public onTransitChange(e: string | number) {
    this.selectedTransit$.next(e as number);
  }

  private findFirstNonWalkTransit(): number {
    if (!this.currentRoute) return 0;

    const index = this.currentRoute.sequences.findIndex(seq => seq.mode !== 'WALK');
    return index >= 0 ? index : 0;
  }

  private evaluateTripStatus(trip: CurrentTrip): boolean {
    const { allStops } = trip;

    const currentGtfsId = trip.transportInfo?.station.gtfsId;
    const destinationGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.destination?.gtfsId;

    const currentStopIndex = this.getStopIndex(allStops, currentGtfsId ?? undefined);
    const destinationStopIndex = this.getStopIndex(allStops, destinationGtfsId);

    this.currentDestinationStop.station.isArrived = currentStopIndex > destinationStopIndex;

    const lastStop = allStops?.[allStops.length - 1];
    const lastStopDelayedDateTime = lastStop?.delay?.delayedDateTime;
    const now = DateTime.now().setZone('Europe/Budapest');

    if (lastStopDelayedDateTime && lastStopDelayedDateTime < now) {
      this.currentTrip = trip;
      this.currentTrip$.next(trip);
    }

    if (this.currentTrip.transportInfo && lastStopDelayedDateTime && lastStopDelayedDateTime < now) {
      this.currentTrip.transportInfo.isFinished = true;
    }

    this.currentTrip$.pipe(take(1)).subscribe(currentTrip => {
      if (
        currentTrip?.transportInfo &&
        lastStopDelayedDateTime &&
        lastStopDelayedDateTime < now
      ) {
        currentTrip.transportInfo.isFinished = true;
        this.currentTrip$.next(currentTrip); // frissül az observable értéke
      }
    });

    return lastStopDelayedDateTime ? lastStopDelayedDateTime > now : false;
  }

  private markTripStops() {
    const originGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.origin?.gtfsId;
    const destinationGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.destination?.gtfsId;

    const originStopIndex = this.currentTrip.allStops.findIndex(stop => stop.station.gtfsId === originGtfsId);
    const destinationStopIndex = this.currentTrip.allStops.findIndex(stop => stop.station.gtfsId === destinationGtfsId);

    if (originStopIndex === -1 || destinationStopIndex === -1) {
      return;
    }

    this.currentTrip = {
      ...this.currentTrip,
      allStops: this.currentTrip.allStops.map((stop, index) => ({
        ...stop,
        station: {
          ...stop.station,
          tripStop: index >= originStopIndex && index <= destinationStopIndex
        }
      }))
    };
  }

  private updateStopState(trip: CurrentTrip) {
    const { allStops, transportInfo } = trip;

    const currentGtfsId = transportInfo?.station.gtfsId;
    const originGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.origin?.gtfsId;
    const destinationGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.destination?.gtfsId;

    const currentStopIndex = this.getStopIndex(allStops, currentGtfsId ?? undefined); // ha -1 jön vissza, ERROR --> Budapest, Újpest-központ M / Budapest, Tél utca / Pozsonyi utca 25-ös busz
    const originStopIndex = this.getStopIndex(allStops, originGtfsId);
    const destinationStopIndex = this.getStopIndex(allStops, destinationGtfsId);

    this.currentTrip = trip;
    this.currentTrip$.next(trip);

    this.currentOriginStop = allStops[originStopIndex];

    if (this.currentOriginStop && currentStopIndex !== -1) {
      this.currentOriginStop.station.isPassed = currentStopIndex > originStopIndex;
    }

    if (this.currentOriginStop && currentStopIndex !== -1) {
    this.currentDestinationStop.station.isArrived = currentStopIndex > destinationStopIndex;
    } 
  }

  private getStopIndex(allStops: StopTime[], gtfsId: string | undefined): number {
    return allStops.findIndex(({ station }) => station.gtfsId === gtfsId);
  }

  public getModeName(sequence: any): string | null {
    const mode = sequence?.mode;
    const modeConfig = this.transportMode?.[mode];

    if (!modeConfig?.name) return null;

    const key = modeConfig.name as keyof TransportInfo;
    return sequence?.transportInfo?.shortName ?? null;
  }

  onTabChange() {
    const tripElement = this.transportCurrentPosition?.nativeElement as HTMLElement;
    const scrollableContainer = document.querySelector<HTMLElement>('.ant-tabs-content-holder');

    if (!scrollableContainer) {
      return;
    }

    if (this.currentTransitDataTabIndex === 0) {
      const containerRect = scrollableContainer.getBoundingClientRect();
      const targetRect = tripElement.getBoundingClientRect();
      const offset = targetRect.top - containerRect.top + scrollableContainer.scrollTop;

      scrollableContainer.scrollTo({
        top: offset - 10,
        behavior: 'smooth'
      });
    } else {    // handle upcoming trips
      scrollableContainer.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    if (this.currentTransitDataTabIndex === 1) {
      scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
    };
  }
}