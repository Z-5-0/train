import { inject, Injectable } from "@angular/core";
import { LocalStorageService } from "./local-storage.service";
import { APP_SETTINGS } from "../shared/constants/settings";
import { BehaviorSubject } from "rxjs";
import { AppSettings, CurrentAppSettings } from "../shared/models/settings";


type SettingsKeys = {
    welcomeCard: string;
    language: string;
    theme: string;
    autoUpdate: string;
    updateTime: number;
    debounceTime: number;
    walkSpeed: number;
    alternativeRoutes: number;
};

@Injectable({
    providedIn: 'root',
})
export class AppSettingsService {
    private readonly APP_SETTINGS: AppSettings = APP_SETTINGS;

    private readonly _appSettings$ = new BehaviorSubject<Record<string, any>>({});      // TODO TYPE CurrentAppSettings ?

    public readonly appSettings$ = this._appSettings$.asObservable();

    localStorageService: LocalStorageService = inject(LocalStorageService);

    constructor() {
        const settings = this.loadOrInitializeSettings();
        this._appSettings$.next(settings);
    }

    loadOrInitializeSettings(): Record<string, any> {
        let settings = this.localStorageService.getItem<AppSettings>('appSettings') ?? null;

        if (settings) {
            return settings;
        }

        settings = {} as AppSettings;

        Object.entries(this.APP_SETTINGS).forEach(([key, config]) => {
            settings[key as keyof AppSettings] = config.defaultValue;
        });

        this.localStorageService.setItem<string>('appSettings', settings as any);

        return settings;
    }

    get currentAppSettings(): CurrentAppSettings {
        return this._appSettings$.getValue() as CurrentAppSettings;
    }

    updateSettings(settings: AppSettings): void {
        this.localStorageService.setItem('appSettings', settings);

        this._appSettings$.next(settings);
    }
}