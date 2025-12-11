import { TRANSPORT_MODE } from "../transport-mode";

export function createNearbyVehiclesQuery(
  bounds: L.LatLngBounds,
  zoom: number
): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  const modes = Object.entries(TRANSPORT_MODE)
    .filter(([mode, modeData]) => modeData.minVisibleZoom !== null)
    .filter(([mode, modeData]) => (modeData.minVisibleZoom as number) <= zoom)
    .map(([mode, modeData]) => mode);

  if (modes.length === 0) return '';

  return `
    {
      vehiclePositions(
        swLat: ${sw.lat},
        swLon: ${sw.lng},
        neLat: ${ne.lat},
        neLon: ${ne.lng},
        ${modes.length ? `modes: [${modes.join(',')}]` : ''}
      ) {
        vehicleId
        lat
        lon
        heading
        vehicleModel
        label
        lastUpdated
        speed
        stopRelationship {
          status
          stop {
            gtfsId
            name
          }
          arrivalTime
          departureTime
        }
        trip {
          id
          gtfsId
          routeShortName
          tripHeadsign
          tripShortName
          route {
            mode
            shortName
            longName
            textColor
            color
          }
          tripGeometry {
            length
            points
          }
          pattern { id }
        }
        prevOrCurrentStop {
          scheduledArrival
          realtimeArrival
          arrivalDelay
          scheduledDeparture
          realtimeDeparture
          departureDelay
        }
      }
    }
  `;
}
