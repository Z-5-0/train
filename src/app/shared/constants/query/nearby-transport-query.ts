import { TRANSPORT_MODE } from "../transport-mode";

export function createNearbyVehiclesQuery(
  bounds: L.LatLngBounds,
  modes: string[] = Object.keys(TRANSPORT_MODE)
    .filter(mode => !['WALK', 'GPS', 'ERROR'].includes(mode))
): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  return `
    {
      vehiclePositions(
        swLat: ${sw.lat},
        swLon: ${sw.lng},
        neLat: ${ne.lat},
        neLon: ${ne.lng},
        modes: [${modes.join(',')}]
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
