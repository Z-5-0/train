export const VEHICLE_POSITION_QUERY: string = `
    query GetVehiclePositionsForTrips($trips: [TripKey]) {
        vehiclePositionsForTrips(trips: $trips) {
          vehicleId
          lat
          lon
          heading
          label
          speed
          trip {
            id
            gtfsId
            routeShortName
            tripHeadsign
            route {
              mode
              shortName
              longName
              color
            }
            tripGeometry {
              points
              length
            }
          }
        }
      }
    `;