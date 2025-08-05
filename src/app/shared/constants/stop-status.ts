import { StopStatus } from "../models/trip";

export const STOP_STATUS: Record<StopStatus, { label: string; icon: string; color: string }> = {
    STOPPED_AT: {
        label: 'Currently at station',
        icon: 'fa-fw fa-solid fa-circle-pause',
        color: '--color-error'
    },
    IN_TRANSIT_TO: {
        label: 'En route to station',
        icon: 'fa-fw fa-solid fa-circle-play',
        color: '--color-success'
    },
    UNKNOWN: {
        label: 'Unknown status',
        icon: 'fa-fw fa-solid fa-circle-question',
        color: '--color-warning'
    }
};