import { TransportMode } from "../models/common";

export const TRANSPORT_MODE: Record<TransportMode, { name: string; label: string, icon: string, color: string, lightColor: boolean }> = {
    COACH: {
        name: 'shortName',
        label: 'Coach',
        icon: 'transport-icon fa-fw fa-solid fa-bus text-amber-500',
        color: '#F59E0B',
        lightColor: true
    },
    TRAM: {
        name: 'shortName',
        label: 'Tram',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-yellow-500',
        color: '#EAB308',
        lightColor: true
    },
    BUS: {
        name: 'shortName',
        label: 'Bus',
        icon: 'transport-icon fa-fw fa-solid  fa-bus-simple text-blue-600',
        color: '#2563EB',
        lightColor: false
    },
    TROLLEYBUS: {
        name: 'shortName',
        label: 'Trolleybus',
        icon: 'transport-icon fa-fw fa-solid fa-bus-simple text-red-600',
        color: '#DC2626',
        lightColor: false
    },
    SUBURBAN_RAILWAY: {
        name: 'longName',
        label: 'Suburban railway',
        icon: 'transport-icon fa-fw fa-solid fa-train text-green-600',
        color: '#16A34A',
        lightColor: false
    },
    RAIL_REPLACEMENT_BUS: {
        name: 'longName',
        label: 'Rail replacement bus',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-amber-700',
        color: '#B45309',
        lightColor: false
    },
    TRAMTRAIN: {
        name: 'shortName',
        label: 'Tram-train',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-red-500',
        color: '#EF4444',
        lightColor: false
    },
    SUBWAY: {
        name: 'shortName',
        label: 'Metro',
        icon: 'transport-icon fa-fw fa-solid fa-train-subway text-gray-700',
        color: '#374151',
        lightColor: false
    },
    RAIL: {
        name: 'longName',
        label: 'Rail',
        icon: 'transport-icon fa-fw fa-solid fa-train text-slate-700',
        color: '#334155',
        lightColor: false
    },
    FERRY: {
        name: 'shortName',
        label: 'Ferry',
        icon: 'transport-icon fa-fw fa-solid fa-ferry text-teal-500',
        color: '#14B8A6',
        lightColor: false
    },
    WALK: {
        name: '',
        label: 'Walk',
        icon: 'transport-icon fa-fw fa-solid fa-person-walking text-stone-400',
        color: '#A8A29E',
        lightColor: true
    },
    GPS: {
        name: '',
        label: 'GPS position',
        icon: 'transport-icon fa-fw fa-solid fa-location-dot text-red-800',
        color: '#991B1B',
        lightColor: false
    },
    ERROR: {
        name: '',
        label: 'Error',
        icon: 'transport-icon fa-fw fa-solid fa-xmark text-violet-600',
        color: '#8B5CF6',
        lightColor: false
    },
}
