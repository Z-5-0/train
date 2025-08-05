import { DateTime } from 'luxon';

export function createPlanQuery(gtfsId: string, day: string = DateTime.now().toFormat('yyyy-MM-dd')) {
  return `
    query {
      trip(id: "${gtfsId}", serviceDay: "${day}") {
        id: gtfsId

        alerts(types: [ROUTE, TRIP]) {
          alertHash
          alertUrl
          alertCause
          alertEffect
          alertHeaderText
          alertSeverityLevel
          alertDescriptionText
          alertUrlTranslations {
            language
            text
          }
          alertHeaderTextTranslations {
            language
            text
          }
          alertDescriptionTextTranslations {
            language
            text
          }
          id
          effectiveStartDate
          effectiveEndDate
          feed
        }

        pattern {
          id
        }

        serviceDescriptions(language: "en-US")

        infoServices(language: "en-US", onlyDisplayable: true) {
          name
          fontCode
          displayable
          fontCharSet
          fromStopIndex
          tillStopIndex
          fromStop {
            id: gtfsId
            name
          }
          tillStop {
            id: gtfsId
            name
          }
        }

        route {
          id: gtfsId
          mode

          alerts(types: [STOPS_ON_ROUTE]) {
            alertHash
            alertUrl
            alertCause
            alertEffect
            alertHeaderText
            alertSeverityLevel
            alertDescriptionText
            alertUrlTranslations {
              language
              text
            }
            alertHeaderTextTranslations {
              language
              text
            }
            alertDescriptionTextTranslations {
              language
              text
            }
            id
            effectiveStartDate
            effectiveEndDate
            feed
          }

          agency {
            id: gtfsId
            name
            url
            timezone
            lang
            phone
            fareUrl
          }

          shortName
          longName
          type
          url
          color
          textColor
          routeBikesAllowed: bikesAllowed
          bikesAllowed

          patterns {
            id
            tripsForDate(serviceDate: "2025-06-18") {
              id: gtfsId
              stops {
                id: gtfsId
              }
            }
          }
        }

        tripShortName
        tripHeadsign
        serviceId
        directionId
        blockId
        shapeId
        wheelchairAccessible
        bikesAllowed
        tripBikesAllowed: bikesAllowed

        stoptimes {
          stop {
            timezone
            alerts(types: [STOP_ON_ROUTES, STOP_ON_TRIPS, STOP]) {
              alertHash
              alertUrl
              alertCause
              alertEffect
              alertHeaderText
              alertSeverityLevel
              alertDescriptionText
              alertUrlTranslations {
                language
                text
              }
              alertHeaderTextTranslations {
                language
                text
              }
              alertDescriptionTextTranslations {
                language
                text
              }
              id
              effectiveStartDate
              effectiveEndDate
              feed
            }

            id: gtfsId
            stopId: gtfsId
            platformCode
            code
            name
            lat
            lon
            geometries {
              geoJson
            }
          }

          scheduledArrival
          realtimeArrival
          arrivalDelay
          scheduledDeparture
          realtimeDeparture
          departureDelay
          pickupType
          dropoffType
          timepoint
          realtime
          realtimeState
          serviceDay
          platformColor
        }

        tripGeometry {
          length
          points
        }

        isThroughCoach

        throughCoaches {
          trip {
            id: gtfsId
            tripShortName
            routeShortName
            stoptimes {
              stop {
                name
              }
            }
            route {
              mode
              shortName
              longName
              textColor
              color
            }
          }
          attachedFromStop {
            name
          }
          attachedTillStop {
            name
          }
          serviceDateDayChange
        }

        pullingTrips {
          trip {
            id: gtfsId
            tripShortName
            routeShortName
            stoptimes {
              stop {
                name
              }
            }
            route {
              mode
              shortName
              longName
              textColor
              color
            }
          }
          attachedFromStop {
            name
          }
          attachedTillStop {
            name
          }
          serviceDateDayChange
        }

        vehiclePositions {
          stopRelationship {
            status
            stop {
              id
              gtfsId
              name
            }
            arrivalTime
            departureTime
          }
          vehicleId
          lat
          lon
          label
          speed
          heading
          lastUpdated
          trip {
            tripShortName
            gtfsId
          }
        }
      }
    }`
}