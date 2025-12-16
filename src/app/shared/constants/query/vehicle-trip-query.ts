import { DateTime } from 'luxon';

export function createVehicleTripQuery(
  gtfsId: string,
  day: string = DateTime.now().toFormat('yyyy-MM-dd')
) {
  return `
     query {
        trip(id: "${gtfsId}", serviceDay: "${day}") {
          id
          gtfsId
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
              geometries {
                geoJson
              }
            }
          }
      }
    }
    `;
}


