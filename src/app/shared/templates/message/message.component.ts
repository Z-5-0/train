import { Component, inject, TemplateRef, ViewChild } from '@angular/core';
import { MessageService } from '../../../services/message.service';
import { CommonModule } from '@angular/common';
import { MessageItem } from '../../models/common';
import { NzNotificationComponent } from 'ng-zorro-antd/notification';

@Component({
  selector: 'message',
  imports: [CommonModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
  standalone: true
})
export class MessageComponent {
  @ViewChild('general', { static: true })
  generalMessage!: TemplateRef<{ $implicit: NzNotificationComponent; data: MessageItem[] }>;

  @ViewChild('transport', { static: true })
  transportMessage!: TemplateRef<{ $implicit: NzNotificationComponent; data: MessageItem[] }>;

  private messageService: MessageService = inject(MessageService);

  ngAfterViewInit() {
    this.messageService.registerTemplate('general', this.generalMessage);
    this.messageService.registerTemplate('transport', this.transportMessage);
  }
}
