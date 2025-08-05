import { Component, inject } from '@angular/core';
import { MapComponent } from '../../shared/components/map/map.component';
import { Place } from '../../shared/models/place';
import { RestApiService } from '../../services/rest-api.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Route } from '../../shared/models/route';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { RoutePlanComponent } from './route-plan/route-plan.component';
import { RouteTransitComponent } from './route-transit/route-transit.component';
import { CurrentTrip } from '../../shared/models/trip';
import { RouteService } from '../../services/route.service';
import { timer } from 'rxjs';


@Component({
  selector: 'route',
  imports: [
    CommonModule,
    MapComponent,
    NzButtonModule,
    NzStepsModule,
    NzIconModule,
    NzTimelineModule,
    NzTabsModule,
    NzBadgeModule,
    RoutePlanComponent,
    RouteTransitComponent,
  ],
  templateUrl: './route.component.html',
  styleUrl: './route.component.scss'
})
export class RouteComponent {
  private routeService: RouteService = inject(RouteService);

  currentStep = 0;
  hasRouteSelected: boolean = false;
  routeIsLoading: boolean = false;
  transitDisabled: boolean = false;   // route is only WALK

  /* onPlaceSelect(event: { name: string; place: Place }) {
    const { name: placeInputName, place } = event;
    (this as any)[placeInputName] = place;

    if (this.currentLocation && event.name === 'originPlace') {
      this.currentLocation = '';
    }
  } */
  ngOnInit() {
    this.routeService.selectedRoute$.subscribe(route => {

      this.transitDisabled = route?.sequences.length === 1 && route.sequences[0].mode === 'WALK';

      this.hasRouteSelected = !!route;

      if (this.hasRouteSelected) {
        this.routeIsLoading = true;
        timer(500).subscribe(() => {
          this.routeIsLoading = false;
        });
      }
    });
  }

  onIndexChange(index: number): void {
    this.currentStep = index;
    // !this.routeService.getSelectedRoute() ? this.hasRouteSelected = false : this.hasRouteSelected = true;
  }

  /* getTrain() {
    this.restApi.getTrain({
      body: {
        query: "query GetVehiclePositionsForTrips($trips: [TripKey]) { \n  vehiclePositionsForTrips(trips: $trips) { \n  vehicleId\n  lat\n  lon\n  heading\n  label\n  lastUpdated\n  speed\n  stopRelationship { \n  status\n  stop { \n  gtfsId\n  name\n } \n  arrivalTime\n  departureTime\n } \n  trip { \n  id\n  gtfsId\n  routeShortName\n  tripHeadsign\n  tripShortName\n  route { \n  mode\n  shortName\n  longName\n  textColor\n  color\n } \n  pattern { \n    id\n } \n } \n } \n }",
        variables:
        {
          "trips": [{
            "serviceDay": 1750197600000, "id": "1:25002717"

          }]
        },
      }
    }).subscribe({
      next: (train) => {
        console.log('TRAIN: ', train);
      }
    })
  } */

  beforeChange(e: any) {
    console.log('beforeChange: ', e);
  }

  afterChange(e: any) {
    console.log('afterChange: ', e);
  }
}