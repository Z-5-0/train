import { ServiceStatusKey } from "../models/trip";

export const SERVICE_STATUS: Record<ServiceStatusKey, { label: string; icon: string; color: string }> = {
    NOT_ALLOWED: { label: 'Bikes not allowed', icon: 'fa-fw fa-solid fa-bicycle', color: '--color-warning' },
    ALLOWED: { label: 'Bikes allowed', icon: 'fa-fw fa-solid fa-bicycle', color: '--color-info' },
    NOT_POSSIBLE: { label: 'Wheelchair not possible', icon: 'fa-fw fa-solid fa-wheelchair', color: '--color-warning' },
    POSSIBLE: { label: 'Wheelchair possible', icon: 'fa-fw fa-solid fa-wheelchair', color: '--color-info' },
    NO_INFORMATION: { label: 'Unknown information', icon: 'fa-fw fa-solid fa-question', color: '--color-error' },
    UNKNOWN: { label: 'Unknown service', icon: 'fa-fw fa-solid fa-xmark', color: '--color-error' },
}