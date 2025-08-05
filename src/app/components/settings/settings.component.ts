import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ModalOptions, NzModalService } from 'ng-zorro-antd/modal';
import { FavouritesComponent } from '../../shared/components/favourites/favourites.component';

@Component({
  selector: 'settings',
  imports: [
    CommonModule,
    FormsModule,
    NzSegmentedModule,
    NzSliderModule,
    NzButtonModule,
    NzFormModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  debounceSliderMarks = { 0: '0', 500: '500', 1000: '1000' };
  walkSliderMarks = { 2: '2', 4: '4', 6: '6' };
  routesSliderMarks = { 2: '2', 9: '9', 16: '16' };

  private modalService: NzModalService = inject(NzModalService);

  openFavouritesModal() {
    const modalOptions: ModalOptions = {
      nzContent: FavouritesComponent,
      nzCentered: false,
      nzData: { rowSelection: true, favouriteSelection: false },
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
        borderRadius: '5px',
        overflow: 'visible',
        padding: '32px 16px 16px 16px',
      }
    };

    const modalRef = this.modalService.create(modalOptions);
  }
}
