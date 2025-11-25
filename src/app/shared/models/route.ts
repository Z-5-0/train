import { DelayStatus, PointGeometry, TransportMode } from "./common";

export interface Route {
  index: number;
  numberOfTransfers: number;
  duration: number;           // in minutes
  startTime: string;          // 'HH:mm' format
  startTimestamp: number;     // UNIX timestamp
  endTime: string;            // 'HH:mm' format
  endTimeTimestamp: number;   // UNIX timestamp
  walkTime: number;
  walkTimeInSeconds: number;
  waitingTime: number;
  sequences: RouteSequence[];
}

export interface RouteSequence {
  realTime: boolean;
  mode: TransportMode;
  origin: OriginOrDestination;
  destination: OriginOrDestination;
  transportInfo: TransportInfo | null;
  stops?: IntermediateStop[] | null;
  sequenceGeometry: {
    length: number,
    points: [number, number][]
  };
}

export interface OriginOrDestination {
  gtfsId?: string;
  name: string;
  geometry: PointGeometry;
  scheduledStartTime?: string;
  delayedStartTime?: string;
  departureDelay?: number;
  status?: DelayStatus;
}

export interface TransportInfo {
  tripId?: string | null;
  routeId?: string | null;
  gtfsId?: string | null;
  headSign?: string | null;
  name?: string | null;
  shortName?: string | null;
  longName?: string | null;
  textColor?: string | null;
  backgroundColor?: string | null;
  [key: string]: string | null | undefined;
}

export interface IntermediateStop {
  id: string;
  name: string;
  geometry: PointGeometry;
}


/* export interface Route {
  numberOfTransfers: number;
  routeSequences: RouteSequence;    // later update: RouteOption[];
}

interface RouteSequence {
  realTime: boolean;
  origin: RouteStopInfo;
  destination: RouteStopInfo;
  stops: RouteStop[];
  transportInfo: RouteTransportInfo;
}

interface RouteStopInfo {
  gtfsId: string;
  name: string;
  geometry: PointGeometry;
  status?: RouteStopStatus;        // origin only
  scheduledStartTime?: string;     // origin only
  departureDelay?: number;         // origin only
  delayedStartTime?: string;       // origin only
}

interface RouteStop {
  name: string;
  geometry: PointGeometry;
}

interface RouteTransportInfo {
  id: string;
  gtfsId: string;
  shortName: string;
  headSign: string;
}

type RouteStopStatus = 'late' | 'on time'; */