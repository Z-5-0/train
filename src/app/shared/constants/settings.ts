import { AppSettings } from "../models/settings";


export const APP_SETTINGS: AppSettings = {
    welcomeCard: {
        index: 1,
        label: 'Welcome card',
        field: 'segmented',
        defaultValue: 1,
        // options: ['Visible', 'Hidden'], // [{label: 'Hidden', value: false}, {label: 'Visible', value: true}]
        options: [{label: 'Hidden', value: 0}, {label: 'Visible', value: 1}],
        marks: null,
        min: null,
        max: null,
        step: null
    },
    language: {
        index: 2,
        label: 'Language',
        field: 'segmented',
        defaultValue: 1,
        // options: ['HU', 'EN'], // [{label: 'EN', value: false}, {label: 'HU', value: true}]
        options: [{label: 'EN', value: 0, disabled: true}, {label: 'HU', value: 1}],
        marks: null,
        min: null,
        max: null,
        step: null
    },
    theme: {
        index: 3,
        label: 'Theme',
        field: 'segmented',
        defaultValue: 1,
        // options: ['Light', 'Dark'], // [{label: 'Dark', value: false}, {label: 'Light', value: true}]
        options: [{label: 'Dark', value: 0, disabled: true}, {label: 'Light', value: 1}],
        marks: null,
        min: null,
        max: null,
        step: null
    },
    autoTripUpdate: {
        index: 4,
        label: 'Continuous update',
        field: 'segmented',
        defaultValue: 1,
        // options: ['Yes', 'No'], // [{label: 'No', value: false}, {label: 'Yes', value: true}]
        options: [{label: 'No', value: 0, disabled: true}, {label: 'Yes', value: 1}],
        marks: null,
        min: null,
        max: null,
        step: null
    },

    tripUpdateTime: {
        index: 5,
        label: 'Trip update time (ms)',
        field: 'slider',
        defaultValue: '10',
        options: null,
        marks: { 5: '5', 10: '10', 15: '15' },
        min: 5,
        max: 15,
        step: 5
    },
    debounceTime: {
        index: 6,
        label: 'Debounce time (ms)',
        field: 'slider',
        defaultValue: '500',
        options: null,
        marks: { 0: '0', 500: '500', 1000: '1000' },
        min: 0,
        max: 1000,
        step: 100
    },
    walkSpeed: {
        index: 7,
        label: 'Walk speed (km/h)',
        field: 'slider',
        defaultValue: '4',
        options: null,
        marks: { 2: '2', 4: '4', 6: '6' },
        min: 2,
        max: 6,
        step: 2
    },
    alternativeRoutes: {
        index: 8,
        label: 'Alternative routes (qty)',
        field: 'slider',
        defaultValue: '9',
        options: null,
        marks: { 2: '2', 9: '9', 16: '16' },
        min: 2,
        max: 16,
        step: 1
    }
}