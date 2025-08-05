import { CommonModule } from '@angular/common';
import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCollapseModule } from 'ng-zorro-antd/collapse';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { RouteService } from '../../../../services/route.service';
import { Route } from '../../../../shared/models/route';
import { TRANSPORT_MODE } from '../../../../shared/constants/transport-mode';


@Component({
  selector: 'route-plan-result',
  imports: [
    CommonModule,
    NzStepsModule,
    NzCardModule,
    NzCollapseModule,
    NzBadgeModule,
    NzTimelineModule,
  ],
  templateUrl: './route-plan-result.component.html',
  styleUrl: './route-plan-result.component.scss'
})
export class RoutePlanResultComponent {
  @Input() routeOptions: Route[] | null = null;

  routeService: RouteService = inject(RouteService);

  public transportMode = TRANSPORT_MODE as Record<string, { name: string; icon: string }>;

  public selectedRoute: Route | null = null;

  ngOnChanges(changes: SimpleChanges) {
    changes['routeOptions'] && (this.selectedRoute = null);
  }

  ngOnInit() {
    this.routeOptions = this.routeService.getRouteOptions();
    this.selectedRoute = this.routeService.getSelectedRoute();
  }

  onSelectRoute(e: MouseEvent, plan: Route) {
    e.preventDefault();
    e.stopPropagation();
    this.selectedRoute = plan;
    this.routeService.setSelectedRoute(plan);
  }
}
