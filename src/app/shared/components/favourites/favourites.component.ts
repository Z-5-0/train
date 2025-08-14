import { Component, Inject, inject } from '@angular/core';
import { NzListModule } from 'ng-zorro-antd/list';
import { FavouriteRouteService } from '../../../services/favourite-route.service';
import { CommonModule } from '@angular/common';
import { TransportModePipe } from '../../pipes/transport-mode.pipe';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NZ_MODAL_DATA, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { Subject, take, takeUntil } from 'rxjs';
import { SelectableRoute } from '../../models/common';
import { FillProgressDirective } from '../../directives/fill-progress.directive';
import { LongPressDirective } from '../../directives/long-press.directive';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { CdkDragDrop, CdkDragEnd, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-favourites',
  imports: [
    CommonModule,
    NzListModule,
    TransportModePipe,
    NzCheckboxModule,
    FormsModule,
    NzButtonModule,
    LongPressDirective,
    FillProgressDirective,
    NzBadgeModule,
    NzAvatarModule,
    DragDropModule,
  ],
  templateUrl: './favourites.component.html',
  styleUrl: './favourites.component.scss'
})
export class FavouritesComponent {
  private favouriteRouteService: FavouriteRouteService = inject(FavouriteRouteService);
  // private modalService: NzModalService = inject(NzModalService);
  private modalRef: NzModalRef = inject(NzModalRef);

  private destroy$ = new Subject<void>();

  favouriteRoutes: any = null;    // TODO TYPE

  selectedRows: any[] = [];   // TODO TYPE

  currentFavourite: number = -1;
  favouriteFillStep: number = 0;

  clearFavouritesDisabled: boolean = false;
  allFavouriteRoutesIsSelected: boolean = false;
  hasSelectedRow: boolean = false;
  isSortable: boolean = false;

  constructor(
    @Inject(NZ_MODAL_DATA) public data: { rowSelection: boolean, favouriteSelection: boolean, sortable: boolean }
  ) {
    this.isSortable = !data.sortable;
  }

  ngOnInit() {
    this.favouriteRoutes = this.favouriteRouteService.getFavouriteRoutes();

    this.favouriteRouteService.favourites$
      .pipe(takeUntil(this.destroy$))
      .subscribe(fav => {
        this.favouriteRoutes = fav;
      });

    this.favouriteRouteService.selectedFavourite$
      .pipe(take(1))
      .subscribe(selected => {
        this.currentFavourite = this.favouriteRoutes.findIndex((fav: SelectableRoute) =>
          fav.originPlace?.id === selected?.originPlace?.id &&
          fav.destinationPlace?.id === selected?.destinationPlace?.id
        ) ?? -1;
      });

    this.currentFavourite = this.favouriteRouteService.getFavouriteRouteIndex();
  }

  selectFavourite(index: number) {
    this.favouriteRouteService.selectFavouriteRoute(index);
    this.modalRef.close({ favouriteSelected: true });
  }

  rowSelectionChange(index: number) {
    this.hasSelectedRow = this.checkHasSelectedRow();
    this.allFavouriteRoutesIsSelected = false;
  }

  deleteSelectedFavourites() {
    const arrayOfIndexes = this.selectedRows
      .map((value, index) => value ? index : -1)
      .filter(idx => idx !== -1);

    this.favouriteRouteService.removeFavouriteRoutes(arrayOfIndexes);

    this.favouriteFillStep = 0;
    this.selectedRows = [];
    this.hasSelectedRow = false;
    this.allFavouriteRoutesIsSelected = false;
  }

  onClearFavouritesLoading(val: number) {
    const percent = val / 10;
    this.favouriteFillStep = percent;
  }

  clearFavourites() {
    this.favouriteFillStep = 0;
    this.selectedRows = [];
    this.hasSelectedRow = false;
    this.allFavouriteRoutesIsSelected = false;
    this.favouriteRouteService.clearFavourites();
    this.modalRef.close();
  }

  toggleSelectAllFavouriteRoutes() {
    for (let i = 0; i < this.favouriteRoutes.length; i++) {
      this.selectedRows[i] = this.allFavouriteRoutesIsSelected ? true : false;
    }

    this.hasSelectedRow = this.checkHasSelectedRow();
  }

  checkHasSelectedRow(): boolean {
    return this.selectedRows.some(row => !!row)
  }

  dropped(e: any) {
    moveItemInArray(this.favouriteRoutes, e.previousIndex, e.currentIndex);
    this.favouriteRouteService.reorderFavouriteRoutes(this.favouriteRoutes);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
