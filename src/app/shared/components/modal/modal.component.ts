import { Component, Inject, Injector, Type } from '@angular/core';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

@Component({
  selector: 'modal',
  imports: [],
  styleUrl: './modal.component.scss',
  template: `
    <ng-container *ngComponentOutlet="contentComponent; injector: contentInjector"></ng-container>
  `,
})
export class ModalComponent {
  contentComponent!: Type<any>;   // TODO TYPE ?
  contentInjector!: Injector;

  constructor(@Inject(NZ_MODAL_DATA) public data: any) {

  }
}
