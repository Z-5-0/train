import { DateTime } from 'luxon';

export function createTripPathQuery(
  ids: (string | null)[],
  day: string = DateTime.now().toFormat('yyyy-MM-dd')
) {
  const queries = ids.map((id, index) => {
    // WALK / missing trip → dummy lekérdezés, ami null-t ad vissza
    const safeId = id || "Trip:DUMMY";

    return `
      trip_${index}: trip(id: "${safeId}", serviceDay: "${day}") {
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
            id: gtfsId
            route {
              shortName
              longName
              mode
            }
          }
          stopRelationship {
            stop {
              gtfsId
              name
            }
          }
        }
      }
    `;
  }).join('\n');

  return `
    query {
      ${queries}
    }
  `;
}


