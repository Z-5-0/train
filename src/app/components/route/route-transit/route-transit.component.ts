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
import { BehaviorSubject, EMPTY, filter, finalize, interval, map, Observable, startWith, Subject, Subscription, switchMap, take, takeUntil, takeWhile, tap } from 'rxjs';
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
  ],
  templateUrl: './route-transit.component.html',
  styleUrl: './route-transit.component.scss'
})
export class RouteTransitComponent {
  routeOptions: Route[] | null = null;

  restApi: RestApiService = inject(RestApiService);
  routeService: RouteService = inject(RouteService);
  tripService: TripService = inject(TripService);

  public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;
  public tripAlert = TRIP_ALERT;

  currentRoute: Route | null = null;
  currentSequences: RouteSequence[] = [];
  currentTrip: CurrentTrip = {} as CurrentTrip;
  currentOriginStop: StopTime | undefined = { station: { isPassed: false } } as StopTime;
  currentDestinationStop: StopTime = { station: { isArrived: false } } as StopTime;

  selectedTransit: number = 0;

  selectedTransit$ = new BehaviorSubject<number>(0);
  tripSubscription?: Subscription;
  destroy$ = new Subject<void>();

  ngOnInit() {
    this.initCurrentRoute();
    this.initTripStream();

    /* this.selectedTransit$.pipe(
      switchMap(selectedTransit => {
        if (!this.currentRoute) return EMPTY;

        const gtfsId = this.currentRoute.sequences[selectedTransit]?.transportInfo?.gtfsId ?? null;
        if (!gtfsId) return EMPTY;

        return this.tripService.getTripPolling(gtfsId);
      }),
      takeWhile(trip => {
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
        }

        if (this.currentTrip.transportInfo && lastStopDelayedDateTime && lastStopDelayedDateTime < now) {
          this.currentTrip.transportInfo.isFinished = true;
        }

        return lastStopDelayedDateTime ? lastStopDelayedDateTime > now : false;
      }),
      takeUntil(this.destroy$)
    ).subscribe(trip => {

      const { allStops, transportInfo } = trip;

      const currentGtfsId = transportInfo?.station.gtfsId;
      const originGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.origin?.gtfsId;
      const destinationGtfsId = this.currentRoute?.sequences[this.selectedTransit]?.destination?.gtfsId;

      const currentStopIndex = this.getStopIndex(allStops, currentGtfsId ?? undefined); // ha -1 jön vissza, ERROR --> Budapest, Újpest-központ M / Budapest, Tél utca / Pozsonyi utca 25-ös busz
      const originStopIndex = this.getStopIndex(allStops, originGtfsId);
      const destinationStopIndex = this.getStopIndex(allStops, destinationGtfsId);

      this.currentTrip = trip;
      this.currentOriginStop = allStops[currentStopIndex];

      if (currentStopIndex !== -1) {
        this.currentOriginStop.station.isPassed = currentStopIndex > originStopIndex;
      }

      this.currentDestinationStop.station.isArrived = currentStopIndex > destinationStopIndex;
    }); */
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
    this.selectedTransit$.pipe(
      switchMap(selectedTransit => this.getTripObservable(selectedTransit)),
      takeWhile(trip => this.evaluateTripStatus(trip)),
      takeUntil(this.destroy$)
    ).subscribe(trip => this.updateStopState(trip));
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

    /*  // TODO LOCALSTORAGE
        if (autoUpdate) {
          return this.tripService.getTripPolling(gtfsId);
        } else {
          return this.tripService.getTrip(gtfsId);
        }
    */

    return this.tripService.getTripPolling(gtfsId);
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
        }

        if (this.currentTrip.transportInfo && lastStopDelayedDateTime && lastStopDelayedDateTime < now) {
          this.currentTrip.transportInfo.isFinished = true;
        }

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
    console.log('onDestroy');
    //  this.tripSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
    // this.tripSubscription?.unsubscribe();
  }
}