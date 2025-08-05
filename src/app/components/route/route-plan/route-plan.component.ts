import { Component, ElementRef, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { RoutePlanSearchComponent } from './route-plan-search/route-plan-search.component';
import { RoutePlanResultComponent } from './route-plan-result/route-plan-result.component';
import { Route } from '../../../shared/models/route';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CommonModule } from '@angular/common';
import { NzBackTopModule } from 'ng-zorro-antd/back-top';
import { ScrollToTopService } from '../../../services/scroll-to-top.sevice';

@Component({
  selector: 'route-plan',
  imports: [
    CommonModule,
    RoutePlanSearchComponent,
    RoutePlanResultComponent,
    NzSpinModule,
    NzBackTopModule,
  ],
  templateUrl: './route-plan.component.html',
  styleUrl: './route-plan.component.scss'
})
export class RoutePlanComponent {
  @ViewChild('routePlanResultContainer') routePlanResultContainerElement!: ElementRef<HTMLElement>;

  scrollToTopService: ScrollToTopService = inject(ScrollToTopService);

  routeOptions: Route[] = [];

  routeIsLoading: boolean = false;

  onRouteOptionsChange(e: Route[]) {
    this.routeOptions = e;
  }

  onRouteIsLoadingChange(e: boolean) {
    this.routeIsLoading = e;
    this.scrollToTopService.scrollToTopOfElement(this.routePlanResultContainerElement, 100);
  }
}
