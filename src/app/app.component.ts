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

  constructor() {
    // this.appSettingsService.loadSettingsFromLocalStorage();
    this.appSettingsService.appSettings$.pipe().subscribe(settings => {
      // console.log(settings);
    })
  }
}
