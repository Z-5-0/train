import { PointGeometry, TransportMode } from "./common";

export interface PlaceGroup {
  [mode: string]: Place[];
}

export interface Place {
  id: string;
  uniqueKey: string;
  name: string;
  code: string;
  type: PlaceType;
  mode: TransportMode;
  score: number;
  geometry: PointGeometry;
}

export interface PlaceSearchEvent {
  value: string;
  name: string;
}

export type PlaceType = 'station' | 'location';

export type TravelDirectionsKeys = 'originPlace' | 'destinationPlace';
