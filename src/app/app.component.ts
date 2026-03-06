import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSettingsService } from './services/app-settings.service';
import { MessageComponent } from './shared/templates/message/message.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MessageComponent],
  template: `
      <router-outlet></router-outlet>
      <message></message>
  `,
  standalone: true,
})
export class AppComponent {
  appSettingsService: AppSettingsService = inject(AppSettingsService);

  theme: number = 1;    // light mode

  constructor() {
    this.appSettingsService.appSettings$.subscribe(settings => {
      document.body.classList.toggle('dark', !settings['theme']);
    })
  }
}
