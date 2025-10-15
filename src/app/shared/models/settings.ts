export interface BaseSetting<T> {
    index: number
    label: string;
    field: SettingFieldType;
    defaultValue: T;
    options: Array<{ label: string; value: T }> | null;
    marks: Record<number, string> | null;
    min: number | null;
    max: number | null;
    step: number | null;
}

type SegmentedSetting<T> =       // <T extends string> : value set of T must be string - ['Visible', 'Hidden']
    Omit<BaseSetting<T>, 'min' | 'max' | 'step' | 'marks'> & {      // creates a copy of BaseSetting<T> without the specific fields(/types)
        field: 'segmented';
        options: Array<{ label: string; value: T }>;
        marks: null;        // after Omit the specific can be redefined
        min: null;
        max: null;
        step: null;
    };

type SliderSetting = Omit<BaseSetting<number>, 'options'> & {
    field: 'slider';
    options: null;
    marks: Record<number, string> | null;
    min: number;
    max: number;
    step: number;
};

type SettingFieldType = 'segmented' | 'slider';

export interface AppSettings {
    welcomeCard: SegmentedSetting<number>;
    language: SegmentedSetting<number>;
    theme: SegmentedSetting<number>;
    autoUpdate: SegmentedSetting<number>;
    updateTime: SliderSetting;
    debounceTime: SliderSetting;
    walkSpeed: SliderSetting;
    alternativeRoutes: SliderSetting;
}

export type Setting = SegmentedSetting<number> | SliderSetting;

export interface CurrentAppSettings {
    alternativeRoutes: number;
    autoUpdate: number;
    debounceTime: number;
    language: number;
    theme: number;
    updateTime: number;
    walkSpeed: number;
    welcomeCard: number
}