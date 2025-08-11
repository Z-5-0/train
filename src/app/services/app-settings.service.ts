import { inject, Injectable } from "@angular/core";
import { LocalStorageService } from "./local-storage.service";
import { APP_SETTINGS } from "../shared/constants/settings";
import { BehaviorSubject } from "rxjs";
import { AppSettings } from "../shared/models/settings";


type SettingsKeys = {
    welcomeCard: string;
    language: string;
    theme: string;
    autoTripUpdate: string;
    tripUpdateTime: number;
    debounceTime: number;
    walkSpeed: number;
    alternativeRoutes: number;
};

@Injectable({
    providedIn: 'root',
})
export class AppSettingsService {
    private readonly APP_SETTINGS: AppSettings = APP_SETTINGS;

    private readonly _appSettings$ = new BehaviorSubject<Record<string, any>>({});

    public readonly appSettings$ = this._appSettings$.asObservable();

    localStorageService: LocalStorageService = inject(LocalStorageService);

    constructor() {
        const settings = this.loadOrInitializeSettings();
        this._appSettings$.next(settings);
    }

    loadOrInitializeSettings(): Record<string, any> {
        const settings: Record<string, any> = {};

        Object.entries(this.APP_SETTINGS).forEach(([key, config]) => {
            let setting = this.localStorageService.getItem<string>(key);

            if (setting === null) {
                this.localStorageService.setItem<string>(key, config.defaultValue);
                setting = config.defaultValue;
            }

            settings[key] = setting;
        });

        return settings;
    }

    updateSettings(key: string, value: string | number): void {
        this.localStorageService.setItem(key, value);

        this._appSettings$.next({ ...this._appSettings$.getValue(), [key]: value });
    }
}