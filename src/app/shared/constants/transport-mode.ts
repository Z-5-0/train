import { TransportMode } from "../models/common";

export const TRANSPORT_MODE: Record<TransportMode, { name: string; label: string, icon: string, color: string }> = {
    COACH: {
        name: 'shortName',
        label: 'Coach',
        icon: 'transport-icon fa-fw fa-solid fa-bus text-amber-500',
        color: '#F59E0B'
    },
    TRAM: {
        name: 'shortName',
        label: 'Tram',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-yellow-500',
        color: '#EAB308'
    },
    BUS: {
        name: 'shortName',
        label: 'Bus',
        icon: 'transport-icon fa-fw fa-solid  fa-bus-simple text-blue-600',
        color: '#2563EB'
    },
    TROLLEYBUS: {
        name: 'shortName',
        label: 'Trolleybus',
        icon: 'transport-icon fa-fw fa-solid fa-bus-simple text-red-600',
        color: '#DC2626'
    },
    SUBURBAN_RAILWAY: {
        name: 'longName',
        label: 'Suburban railway',
        icon: 'transport-icon fa-fw fa-solid fa-train text-green-600',
        color: '#16A34A'
    },
    RAIL_REPLACEMENT_BUS: {
        name: 'longName',
        label: 'Rail replacement bus',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-amber-700',
        color: '#B45309'
    },
    TRAMTRAIN: {
        name: 'shortName',
        label: 'Tram-train',
        icon: 'transport-icon fa-fw fa-solid fa-train-tram text-red-500',
        color: '#EF4444'
    },
    SUBWAY: {
        name: 'shortName',
        label: 'Metro',
        icon: 'transport-icon fa-fw fa-solid fa-train-subway text-gray-700',
        color: '#374151'
    },
    RAIL: {
        name: 'longName',
        label: 'Rail',
        icon: 'transport-icon fa-fw fa-solid fa-train text-slate-700',
        color: '#334155'
    },
    FERRY: {
        name: 'shortName',
        label: 'Ferry',
        icon: 'transport-icon fa-fw fa-solid fa-ferry text-teal-500',
        color: '#14B8A6'
    },
    WALK: {
        name: '',
        label: 'Walk',
        icon: 'transport-icon fa-fw fa-solid fa-person-walking text-stone-400',
        color: '#A8A29E'
    },
    GPS: {
        name: '',
        label: 'GPS position',
        icon: 'transport-icon fa-fw fa-solid fa-location-dot text-red-800',
        color: '#991B1B'
    },
    ERROR: {
        name: '',
        label: 'Error',
        icon: 'transport-icon fa-fw fa-solid fa-xmark text-violet-600',
        color: '#8B5CF6'
    },
}
