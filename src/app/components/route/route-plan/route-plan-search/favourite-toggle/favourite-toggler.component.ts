import { Component, computed, effect, inject, Input, Signal, signal, SimpleChanges, WritableSignal } from '@angular/core';
import { ModalOptions, NzModalService } from 'ng-zorro-antd/modal';
import { FavouritesComponent } from '../../../../../shared/components/favourites/favourites.component';
import { Place } from '../../../../../shared/models/place';
import { FavouriteRouteService } from '../../../../../services/favourite-route.service';
import { timer } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FillProgressDirective } from '../../../../../shared/directives/fill-progress.directive';
import { LongPressDirective } from '../../../../../shared/directives/long-press.directive';


@Component({
  selector: 'favourite-toggler',
  imports: [
    CommonModule,
    LongPressDirective,
    FillProgressDirective,
  ],
  templateUrl: './favourite-toggler.component.html',
  styleUrl: './favourite-toggler.component.scss',
  standalone: true
})
export class FavouriteTogglerComponent {
  @Input() originPlace: WritableSignal<Place | null> = signal<Place | null>(null);
  @Input() destinationPlace: WritableSignal<Place | null> = signal<Place | null>(null);
  @Input() hasCurrentLocation: WritableSignal<boolean> = signal<boolean>(false);
  @Input() fillPercent: number = 0;
  @Input() routeIsFavourite: boolean = false;

  modalService: NzModalService = inject(NzModalService);
  favouriteRouteService: FavouriteRouteService = inject(FavouriteRouteService);

  changeIsBlocked: WritableSignal<boolean> = signal<boolean>(false);

  readonly favouriteLongPressDisabled = computed(() =>
    !this.originPlace() ||
    !this.destinationPlace() ||
    this.hasCurrentLocation() ||
    this.changeIsBlocked()
  );

  openFavouritesModal() {
    this.fillPercent = this.routeIsFavourite ? 100 : 0;

    const modalOptions: ModalOptions = {
      nzContent: FavouritesComponent,
      nzCentered: false,
      nzData: { rowSelection: false, favouriteSelection: true },
      nzFooter: null,
      nzTitle: '',
      nzClosable: true,
      nzWidth: '574px',
      nzBodyStyle: {
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'hidden',
      },
      nzStyle: {
        top: '0',
        // bottom: '0',
        borderRadius: '5px',
        overflow: 'visible',
        padding: '32px 16px 16px 16px',
      }
    };

    const modalRef = this.modalService.create(modalOptions);
  }

  toggleFavouriteRoute() {
    if (!this.originPlace() || !this.destinationPlace()) {
      return;
    }

    if (this.routeIsFavourite) {
      this.favouriteRouteService.removeCurrentFavouriteRoute();
      this.routeIsFavourite = false;
      return;
    }

    const setIsSucceeded = this.favouriteRouteService.setFavouriteRoute(
      { originPlace: this.originPlace(), destinationPlace: this.destinationPlace() }
    )

    if (setIsSucceeded) {
      this.routeIsFavourite = true;
      this.blockFavouriteChange();
      return;
    }

    this.fillPercent = 0;
  }

  onFavouriteLoading(val: number) {
    const percent = val / 10;

    this.fillPercent = this.routeIsFavourite
      ? 100 - percent
      : percent;
  }

  private blockFavouriteChange() {
    this.changeIsBlocked.set(true);
    timer(1000).subscribe(() => this.changeIsBlocked.set(false))
  }
}
