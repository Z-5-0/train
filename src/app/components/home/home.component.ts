import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { NzCarouselComponent, NzCarouselModule } from 'ng-zorro-antd/carousel';
import { RouteComponent } from '../route/route.component';
import { WelcomeComponent } from '../welcome/welcome.component';
import { HOME_CARDS } from '../../shared/constants/card'
import { SettingsComponent } from '../settings/settings.component';
import { RouteService } from '../../services/route.service';
import { TransportModePipe } from '../../shared/pipes/transport-mode.pipe';
import { TransportMode } from '../../shared/models/common';
import { DateTime } from 'luxon';
import { filter, map, Subject, Subscription, takeUntil, tap } from 'rxjs';
import { MapComponent } from '../../shared/components/map/map.component';
import { AppSettingsService } from '../../services/app-settings.service';

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
  @ViewChild('carousel') carousel!: NzCarouselComponent;

  routeService: RouteService = inject(RouteService);
  appSettingsService: AppSettingsService = inject(AppSettingsService);

  homeCards = HOME_CARDS;
  currentHomeCards = JSON.parse(JSON.stringify(this.homeCards));

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

  activeIndex!: number;

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

  ngAfterViewInit() {
    this.appSettingsService.appSettings$
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe(settings => {
        console.log(settings);
        this.activeIndex = this.carousel?.activeIndex ?? 0;

        this.carousel.nzTransitionSpeed = 0;
        this.carousel.nzEffect = 'fade';

        this.currentHomeCards = settings['welcomeCard']
          ? [...this.homeCards]
          : this.homeCards.filter(card => card.index !== 4);

        setTimeout(() => {
          this.carousel?.goTo(this.activeIndex);
          this.carousel.nzTransitionSpeed = 500;
          this.carousel.nzEffect = 'scrollx';
        });
      });
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




