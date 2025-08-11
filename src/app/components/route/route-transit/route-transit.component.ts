import { Component, inject } from '@angular/core';
import { Route, RouteSequence, TransportInfo } from '../../../shared/models/route';
import { RouteService } from '../../../services/route.service';
import { TRANSPORT_MODE } from '../../../shared/constants/transport-mode';
import { CommonModule } from '@angular/common';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { KmPipe } from '../../../shared/pipes/km.pipe';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { RestApiService } from '../../../services/rest-api.service';
import { FormsModule } from '@angular/forms';
import { createPlanQuery } from '../../../shared/constants/query/plan-query';
import { BehaviorSubject, catchError, EMPTY, filter, finalize, interval, map, merge, Observable, startWith, Subject, Subscription, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs';
import { Trip, TripResponse } from '../../../shared/models/api/response-trip';
import { CurrentTrip, StopStatus, StopTime } from '../../../shared/models/trip';
import { DelayStatus, PointGeometry } from '../../../shared/models/common';
import { DateTime, Duration } from 'luxon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzCardModule } from 'ng-zorro-antd/card';
import { TRIP_ALERT } from '../../../shared/constants/trip-alert';
import { SafeHtmlPipe } from '../../../shared/pipes/safe-html-pipe';
import { StopStatusPipe } from '../../../shared/pipes/stop-status.pipe';
import { TripService } from '../../../services/trip.service';
import { AppSettingsService } from '../../../services/app-settings.service';
import { NzSpinModule } from 'ng-zorro-antd/spin';


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
    NzSpinModule,
  ],
  templateUrl: './route-transit.component.html',
  styleUrl: './route-transit.component.scss'
})
export class RouteTransitComponent {
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
  tripStreamDestroy$ = new Subject<void>();

  tripIsLoading: boolean = false;

  ngOnInit() {
    this.initCurrentRoute();
    this.initTripStream();

    this.appSettingsService.appSettings$
      .pipe(
    )
      .subscribe(settings => {
        this.autoUpdate = !!settings['autoTripUpdate'];
        console.log('autoTrip: ', this.autoUpdate);
        this.tripStreamDestroy$.next();
        this.tripStreamDestroy$ = new Subject<void>();
        this.initTripStream();
      })
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
    merge(
      this.selectedTransit$.pipe(
        tap(() => this.tripIsLoading = true),
        switchMap(selectedTransit => this.getTripObservable(selectedTransit)),
        takeWhile(trip => this.evaluateTripStatus(trip)),
      ),
      this.restApi.errorNotification$.pipe(
        tap(() => {
          this.tripIsLoading = false;
        })
      )
    ).pipe(
      takeUntil(this.tripStreamDestroy$)
    ).subscribe({
      next: trip => {
        if (trip) {
          this.updateStopState(trip);
          this.tripIsLoading = false;
        }
      }
    });
  }

  public handleValueChange(e: string | number) {
    this.selectedTransit$.next(e as number);
  }

  private findFirstNonWalkTransit(): number {
    if (!this.currentRoute) return 0;

    const index = this.currentRoute.sequences.findIndex(seq => seq.mode !== 'WALK');
    return index >= 0 ? index : 0;
  }

  private getTripObservable(selectedTransit: number): Observable<CurrentTrip> {
    if (!this.currentRoute) return EMPTY;

    const gtfsId = this.currentRoute.sequences[selectedTransit]?.transportInfo?.gtfsId ?? null;
    if (!gtfsId) return EMPTY;

    return this.autoUpdate
      ? this.tripService.getTripPolling(gtfsId)
      : this.tripService.getTrip(gtfsId);
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
        this.currentTrip$.next(currentTrip); // frissíted az observable értékét
      }
    });

    return lastStopDelayedDateTime ? lastStopDelayedDateTime > now : false;
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

    this.currentOriginStop = allStops[currentStopIndex];

    if (currentStopIndex !== -1) {
      this.currentOriginStop.station.isPassed = currentStopIndex > originStopIndex;
    }

    this.currentDestinationStop.station.isArrived = currentStopIndex > destinationStopIndex;
  }

  private getStopIndex(allStops: StopTime[], gtfsId: string | undefined): number {
    return allStops.findIndex(({ station }) => station.gtfsId === gtfsId);
  }

  /* getTrip() {
    console.log('currentRoute: ', this.currentRoute);
    const gtfsId = this.currentRoute?.sequences[this.selectedTransit]?.transportInfo?.gtfsId ?? null;   // TODO ERROR

    this.tripSubscription = this.tripService.getTrip(gtfsId).subscribe((s: any) => {
      console.log('SUB: ', s);
      this.currentTrip = s;
    })

    return;

    this.tripService.getTrip(gtfsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(trip => {
        this.currentTrip = trip;
      });

    this.tripSubscription = this.selectedTransit$.pipe(
      switchMap(selectedTransitIndex => {
        const gtfsId = this.currentRoute?.sequences[selectedTransitIndex!]?.transportInfo?.gtfsId;

        if (!gtfsId) {
          return EMPTY;
        }

        return interval(5000).pipe(
          startWith(0),
          switchMap(() => this.restApi.getTrip({
            body: {
              query: createPlanQuery(gtfsId),
              variables: {}
            }
          })),
          map((response: TripResponse): CurrentTrip => this.transformTripResponse(response.data.trip)),
          tap(trip => {
            console.log('currentTrip: ', trip);
            this.currentTrip = trip;
          })
        );
      })
    ).subscribe();
  } */

  public getModeName(sequence: any): string | null {
    const mode = sequence?.mode;
    const modeConfig = this.transportMode?.[mode];

    if (!modeConfig?.name) return null;

    const key = modeConfig.name as keyof TransportInfo;
    return sequence?.transportInfo?.shortName ?? null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.tripStreamDestroy$.next();
    this.tripStreamDestroy$.complete();
  }
}