import { Component } from '@angular/core';
import { TRANSPORT_MODE } from '../../shared/constants/transport-mode';
import { CommonModule, KeyValuePipe } from '@angular/common';

@Component({
  selector: 'info',
  imports: [
    CommonModule,
    KeyValuePipe
  ],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss'
})
export class InfoComponent {
    public transportMode = TRANSPORT_MODE as Record<string, { name: string; label: string, icon: string }>;
}
