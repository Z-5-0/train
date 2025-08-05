import { AlertSeverityLevel } from "../models/trip";

export const TRIP_ALERT: Record<AlertSeverityLevel, { label: string; icon: string; color: string }> = {
    INFO: { label: 'Information', icon: 'fa-fw fa-solid fa-circle-info', color: '--color-info' },
    WARNING: { label: 'Warning', icon: 'fa-fw fa-solid fa-triangle-exclamation', color: '--color-warning' },
    SEVERE: { label: 'Critical error', icon: 'fa-fw fa-solid fa-circle-exclamation', color: '--color-error' },
    UNKNOWN_SEVERITY: { label: 'Unknown', icon: 'fa-fw fa-solid fa-circle-question', color: '--color-warning' }
}