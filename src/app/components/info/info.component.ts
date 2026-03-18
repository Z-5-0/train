import { Component, TemplateRef } from '@angular/core';
import { TRANSPORT_MODE } from '../../shared/constants/transport-mode';
import { CommonModule, KeyValue, KeyValuePipe } from '@angular/common';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { FormsModule } from '@angular/forms';
import { TransportMode, TransportModeOptions } from '../../shared/models/common';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

type TabItem = {
  value: number;
  label: string;
}

type IssueItem = {
  index: number;
  description: string;
}

type IconLegendItem = {
  index: number;
  description: string;
  icon: string;
}

interface BaseLegendItem {
  index: number;
  description: string;
}

export interface DurationLegendItem extends BaseLegendItem {
  type: 'duration';
  value: string;
}

export interface StatusLegendItem extends BaseLegendItem {
  type: 'status';
  label: string;
  badgeClass: 'success' | 'warning' | 'error';
  sup?: boolean;
  countTemplate?: TemplateRef<unknown>;
}

export type CustomLegendItem = DurationLegendItem | StatusLegendItem;

@Component({
  selector: 'info',
  imports: [
    CommonModule,
    KeyValuePipe,
    NzSegmentedModule,
    FormsModule,
    NzBadgeModule,
  ],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss'
})
export class InfoComponent {
  public transportMode = TRANSPORT_MODE
  // public transportMode =  Object.fromEntries(Object.entries(TRANSPORT_MODE).filter(([key]) => !key.includes('ERROR')));

  infoIndex: string | number = 0;

  tabs: TabItem[] = [
    { value: 0, label: 'User guide' },
    { value: 1, label: 'Known issues' },
    { value: 2, label: 'Legend' },
  ];

  issues: IssueItem[] = [
    { index: 0, description: 'Midnight trips sometimes show as \'Trip has finished\' even though the trip is scheduled for the next day' },
    { index: 1, description: 'Circles and heading indicators around vehicles sometimes may remain visible when position or heading is missing' },
    { index: 2, description: 'When all vehicles reach their final stop, the map does not indicate \'All trips have been finished\'' },
    { index: 3, description: 'The URL bar may cause content to overflow on mobile' },
    { index: 4, description: 'CORS errors may occur under certain configurations' },
    { index: 5, description: 'User guide missing' },
    { index: 6, description: 'Accidental \'upcoming\' text appearance at trip starting stop' },
    { index: 7, description: 'Wrong intermediate stops text shadow on map (etc. coach, tram)' },
    { index: 8, description: 'Card navigation (swipe / keyboard) is currently in an early stage of implementation' },
    { index: 9, description: 'API requests are handled by my own server; response times may be slow and occasionally delayed depending on network and device load' }
  ];

  iconLegends: IconLegendItem[] = [
    { index: 0, description: 'Favourites', icon: 'fa-fw fa-solid fa-heart' },
    { index: 1, description: 'Favourite route selected', icon: 'fa-fw fa-solid fa-heart text-error' },
    { index: 2, description: 'Get GPS position', icon: 'fa-fw fa-solid fa-location-crosshairs text-success' },
    { index: 3, description: 'GPS position not available', icon: 'fa-fw fa-solid fa-location-crosshairs text-error' },
    { index: 4, description: 'Swap origin and destination place', icon: 'fa-fw fa-solid fa-retweet text-success' },
    { index: 5, description: 'Cannot swap origin and destination place', icon: 'fa-fw fa-solid fa-retweet text-error' },
    { index: 6, description: 'Origin position', icon: 'fa-fw fa-solid fa-map-marker-alt text-emerald-500' },
    { index: 7, description: 'Destination position', icon: 'fa-fw fa-solid fa-flag-checkered text-rose-500' },
    { index: 8, description: 'Clear field', icon: 'fa-solid fa-circle-xmark' },
    { index: 9, description: 'Hovered on clear field', icon: 'fa-solid fa-circle-xmark text-error' },
    { index: 10, description: 'Current position', icon: 'fa-fw fa-solid fa-location-arrow text-red-600' },
    { index: 11, description: 'Point of change transport mode during trip', icon: 'fa-regular fa-circle text-[#828282]' },
  ];

  customLegendItems: CustomLegendItem[] = [
    {
      index: 0,
      type: 'duration',
      value: 'X',
      description: 'Total trip duration'
    },
    {
      index: 1,
      type: 'status',
      label: 'on time',
      badgeClass: 'success',
      sup: false,
      description: 'Transport is on time'
    },
    {
      index: 2,
      type: 'status',
      label: 'early',
      badgeClass: 'warning',
      sup: true,
      description: 'Transport is early by X minutes'
    },
    {
      index: 3,
      type: 'status',
      label: 'late',
      badgeClass: 'error',
      sup: true,
      description: 'Transport is late by X minutes'
    }
  ];

  compareFn(
    a: KeyValue<TransportMode, TransportModeOptions>,
    b: KeyValue<TransportMode, TransportModeOptions>
  ): number {
    return (a.value.index ?? 0) - (b.value.index ?? 0);
  }
}
