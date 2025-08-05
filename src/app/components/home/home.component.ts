import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { NzCarouselModule } from 'ng-zorro-antd/carousel';
import { RouteComponent } from '../route/route.component';
import { WelcomeComponent } from '../welcome/welcome.component';
import { HOME_CARDS } from '../../shared/constants/card'
import { SettingsComponent } from '../settings/settings.component';
import { RouteService } from '../../services/route.service';
import { TransportModePipe } from '../../shared/pipes/transport-mode.pipe';
import { TransportMode } from '../../shared/models/common';
import { DateTime } from 'luxon';
import { map, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { MapComponent } from '../../shared/components/map/map.component';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    NzCarouselModule,
    RouteComponent,
    WelcomeComponent,
    SettingsComponent,
    TransportModePipe,
    MapComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true
})
export class HomeComponent {
  routeService: RouteService = inject(RouteService);

  homeCards = HOME_CARDS;

  dotPosition: string = 'top';
  latestSearchTime: string = '';

  isSwipeEnabled: boolean = true;

  selectedRoute: {
    origin: { name: string; mode: TransportMode };
    destination: { name: string; mode: TransportMode };
  } = {
      origin: { name: '', mode: 'ERROR' },
      destination: { name: '', mode: 'ERROR' }
    };

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.routeService.selectedRoute$
      .pipe(
        takeUntil(this.destroy$),
        map(route => {
          const sequences = route?.sequences ?? [];
          const firstSequence = sequences[0];
          const lastSequence = sequences[sequences.length - 1];
          return {
            origin: {
              name: firstSequence?.origin?.name ?? '',
              mode: firstSequence?.mode ?? 'ERROR',
            },
            destination: {
              name: lastSequence?.destination?.name ?? '',
              mode: lastSequence?.mode ?? 'ERROR',
            }
          };
        }))
      .subscribe(result => {
        this.selectedRoute = result;
      });

    this.routeService.routeOptions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(options => options?.length && (this.latestSearchTime = DateTime.now().toFormat('yyyy-LL-dd HH:mm')));
  }

  onContentPress(event: any) {
    // console.log('onContentPress: ', event);
    // this.isSwipeEnabled = false;
  }

  onContentRelease(event: any) {
    // console.log('onContentRelease, ', event);
    // this.isSwipeEnabled = true;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}




