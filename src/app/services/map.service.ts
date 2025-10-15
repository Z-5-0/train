import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { ActiveMap, MapMode } from "../shared/models/map";
import * as L from 'leaflet';

@Injectable({ providedIn: 'root' })
export class MapService {
    // private _mapType$: BehaviorSubject<MapMode> = new BehaviorSubject<MapMode>('FREE');
    // readonly mapType$ = this._mapType$.asObservable();

    setMapMode(mode: MapMode) {
        // this._mapType$.next(mode);
    }

    getMapMode() {
        // return this._mapType$.getValue();
    }

    drawPolyline(
        points: L.LatLngExpression[],
        color: string,
        weight: number = 3,
        className: string = ''
    ): L.Polyline {
        return L.polyline(points, {
            color,
            className,
            weight
        })
    }

    drawCircleMarker(
        point: L.LatLngExpression,
        color: string = '#000000',
        fill: boolean = false,
        fillOpacity: number = 1,
        fillColor: string = '',
        weight: number = 2,
        radius: number = 5
    ): L.CircleMarker {
        return L.circleMarker(point, {
            color,
            fill: fill,
            fillOpacity,
            fillColor,
            weight,
            radius
        })
    }

    drawDivIcon(
        point: L.LatLngExpression,
        color: string,
        name: string,
        status: string | null,
        delayedStartTime: string,
        className: string,
        icon: string = 'fa-fw fa-solid fa-clock',
        iconAnchor: [number, number] = [0, 0]
    ): L.Marker {
        return L.marker(point, {
            icon: L.divIcon({
                html: `<div>
                        <div style="color: ${color}">${name}</div>
                        ${status?.length
                        ? `
                            <div class="start-time ${status === 'early' ? 'early' : status === 'late' ? 'late' : ''}">
                                <i class="${icon}"></i>
                                <span>${delayedStartTime}</span>
                            </div>
                            `
                        : ''
                    }
                    </div>`,
                className,
                iconAnchor,
            })
        })
    }

    fitBounds(map: L.Map, points: L.LatLngExpression[]) {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, {
            padding: [10, 10]
        });
    }
}