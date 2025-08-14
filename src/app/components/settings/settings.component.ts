import { CommonModule, KeyValue } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { NzSliderModule, NzSliderValue } from 'ng-zorro-antd/slider';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { ModalOptions, NzModalService } from 'ng-zorro-antd/modal';
import { FavouritesComponent } from '../../shared/components/favourites/favourites.component';
import { LocalStorageService } from '../../services/local-storage.service';
import { APP_SETTINGS } from '../../shared/constants/settings';
import { AppSettings, BaseSetting, Setting } from '../../shared/models/settings';
import { AppSettingsService } from '../../services/app-settings.service';
import { Subject, take, takeUntil } from 'rxjs';

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
  public originalSettingsModel!: Record<string, Setting>;
  public settingsModel!: Record<string, Setting>;
  public settingsChanged: boolean = false;
  private destroy$: Subject<void> = new Subject<void>;

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
      nzData: { rowSelection: true, favouriteSelection: false, sortable: true },
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
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(settings => {
        this.originalSettingsModel = { ...settings };
        this.settingsModel = { ...settings };
        this.settingsChanged = false;
      });
  }

  settingValueChange(value: number[] | number | string, key: string) {
    (this.settingsModel as any)[key] = value;
    this.settingsChanged = JSON.stringify(this.originalSettingsModel) !== JSON.stringify(this.settingsModel);
  }

  trackSetting(index: number, item: { key: string; value: BaseSetting<string> }) {
    return item.value.index;
  }

  saveChanges() {
    this.appSettingsService.updateSettings(this.settingsModel as unknown as AppSettings);   // multiple type assertion for bypassing Typescript compatibility check
  }

  cancelChanges() {
    this.settingsModel = { ...this.originalSettingsModel };
    this.settingsChanged = false;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
