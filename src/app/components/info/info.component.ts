import { Component } from '@angular/core';
import { TRANSPORT_MODE } from '../../shared/constants/transport-mode';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { NzSegmentedModule } from 'ng-zorro-antd/segmented';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'info',
  imports: [
    CommonModule,
    KeyValuePipe,
    NzSegmentedModule,
    FormsModule,
  ],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss'
})
export class InfoComponent {
  public transportMode = TRANSPORT_MODE as Record<string, { name: string; label: string, icon: string }>;

  infoIndex: string | number = 0;

  tabs = [    // TODO INTERFACE
    { value: 0, label: 'User guide' },
    { value: 1, label: 'Known issues' },
    { value: 2, label: 'Legend' },
  ];

  issues = [    // TODO INTERFACE
    { index: 0, text: 'Midnight trips sometimes show as \'Trip has finished\' even though the trip is scheduled for the next day' },
    { index: 1, text: 'Circles and heading indicators around vehicles sometimes remain visible when \'vehiclePosition\' or \'heading\' is null' },
    { index: 2, text: 'When all vehicles reach their final stop, the map does not always indicate \'All trips have been finished\'' },
    { index: 3, text: 'On initial map load, the circle around a vehicle can occasionally shift slightly to the left' },
    { index: 4, text: 'Zoom level and map position are not persisted when returning to the map component' },
    { index: 5, text: 'Error messages do not always appear consistently' },
    { index: 6, text: 'Mobile layout issues: the URL bar may cause content to overflow' },
    { index: 7, text: 'On mobile, route list item details can overflow horizontally' },
    { index: 8, text: 'CORS errors may occur under certain configurations' },
    { index: 9, text: 'Footer gradient is currently displayed on all views; it should only appear on Route and Transit views' },
    { index: 10, text: 'User guide missing' },
    { index: 11, text: 'API requests are handled by my own server; response times may be slow and occasionally delayed depending on network and device load' },
    { index: 12, text: 'Accidental \'upcoming\' text appearance at trip starting stop' },
    { index: 13, text: 'Wrong intermediate stops text shadow on map (etc. coach, tram)' },

    { index: 15, text: 'Clean code' },
  ];

}
