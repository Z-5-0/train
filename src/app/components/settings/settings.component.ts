import { CommonModule, KeyValue } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSliderModule } from 'ng-zorro-antd/slider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ModalOptions, NzModalService } from 'ng-zorro-antd/modal';
import { FavouritesComponent } from '../../shared/components/favourites/favourites.component';
import { LocalStorageService } from '../../services/local-storage.service';
import { APP_SETTINGS } from '../../shared/constants/settings';
import { BaseSetting } from '../../shared/models/settings';
import { AppSettingsService } from '../../services/app-settings.service';
import { take } from 'rxjs';

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
  public APP_SETTINGS: Record<string, any> = APP_SETTINGS;
  public settingsModel: any;

  orderByIndex = (
    a: KeyValue<string, any>,
    b: KeyValue<string, any>
  ): number => {
    return a.value.index - b.value.index;
  };

  private modalService: NzModalService = inject(NzModalService);
  private appSettingsService: AppSettingsService = inject(AppSettingsService);

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

  ngOnInit() {
    this.appSettingsService.appSettings$
      .pipe(take(1))
      .subscribe(settings => {
        this.settingsModel = settings;
      });
  }

  settingValueChange(e: string | number, modelName: string) {
    (this as any)[modelName] = e;
    this.appSettingsService.updateSettings(modelName, e);
  }

  trackSetting(index: number, item: { key: string; value: BaseSetting<string> }) {
    return item.value.index;
  }

  ngOnDestroy() {
    console.log('settings destroyed');
  }
}
