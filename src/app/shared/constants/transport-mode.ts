import { TransportMode } from "../models/common";

export const TRANSPORT_MODE: Record<TransportMode, { name: string; icon: string }> = {
    COACH: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-bus text-amber-500' },
    TRAM: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-train-tram text-yellow-500' },
    BUS: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid  fa-bus-simple text-blue-600' },
    TROLLEYBUS: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-bus-simple text-red-600' },
    SUBURBAN_RAILWAY: { name: 'longName', icon: 'transport-icon fa-fw fa-solid fa-train text-green-600' },
    RAIL_REPLACEMENT_BUS: { name: 'longName', icon: 'transport-icon fa-fw fa-solid fa-train-tram text-amber-700' },
    TRAMTRAIN: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-train-tram text-red-500' },
    SUBWAY: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-train-subway text-gray-700' },
    RAIL: { name: 'longName', icon: 'transport-icon fa-fw fa-solid fa-train text-slate-700' },
    FERRY: { name: 'shortName', icon: 'transport-icon fa-fw fa-solid fa-ferry text-teal-500' },
    WALK: { name: '', icon: 'transport-icon fa-fw fa-solid fa-person-walking text-stone-700' },
    GPS: { name: '', icon: 'transport-icon fa-fw fa-solid fa-location-dot text-red-800' },
    ERROR: { name: '', icon: 'transport-icon fa-fw fa-solid fa-xmark text-violet-600' },
}