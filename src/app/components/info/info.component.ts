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

  tabs = [
    { value: 0, label: 'User guide' },
    { value: 1, label: 'Known issues' },
    { value: 2, label: 'Legend' },
  ];
}
