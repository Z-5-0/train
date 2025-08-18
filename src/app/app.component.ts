import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppSettingsService } from './services/app-settings.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
      <router-outlet></router-outlet>
  `,
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
