import { DateTime } from 'luxon';

export function createTripPathQuery(ids: string[], day: string = DateTime.now().toFormat('yyyy-MM-dd')) {
    const queries = ids.map((id, index) => `
    ${'trip_' + index}: trip(id: "${id}", serviceDay: "${day}") {
      id
      stoptimes {
        scheduledArrival
        realtimeArrival
        arrivalDelay
        scheduledDeparture
        realtimeDeparture
        departureDelay
        realtime
        serviceDay
        stop {
          gtfsId
          name
          lat
          lon
          geometries { geoJson }
        }
      }
      tripGeometry { length points }
      vehiclePositions {
        vehicleId
        lat
        lon
        heading
        speed
        lastUpdated
        trip {
            route {
                shortName
                longName
                mode
            }
        }
      }
    }
  `).join('\n');

    return `
    query {
      ${queries}
    }
  `;
}
