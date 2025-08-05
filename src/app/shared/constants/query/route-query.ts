export const ROUTE_QUERY: string = `
  query Plan(
    $fromPlace: String!
    $toPlace: String!
    $date: String!
    $time: String!
    $modes: [TransportMode]
    $distributionChannel: String!
    $distributionSubChannel: String!
    $numItineraries: Int!
    $walkSpeed: Float
    $minTransferTime: Int
    $arriveBy: Boolean
    $transitPassFilter: [String]
    $comfortLevels: [String]
    $searchParameters: [String]
    $banned: InputBanned
  ) {
    plan(
      fromPlace: $fromPlace
      toPlace: $toPlace
      date: $date
      time: $time
      transportModes: $modes
      locale: "en"
      numItineraries: $numItineraries
      distributionChannel: $distributionChannel
      distributionSubChannel: $distributionSubChannel
      walkSpeed: $walkSpeed
      minTransferTime: $minTransferTime
      arriveBy: $arriveBy
      transitPassFilter: $transitPassFilter
      comfortLevels: $comfortLevels
      searchParameters: $searchParameters
      banned: $banned
    ) {
      itineraries {
        numberOfTransfers
        duration
        startTime
        endTime
        walkTime
        waitingTime
        legs {
          mode
          realTime
          startTime
          departureDelay
          from {
            name
            lat
            lon
            stop {
              id,
              gtfsId
            }
          }
          to {
            name
            lat
            lon
            stop { gtfsId }
          }
          intermediateStops {
            id
            name
            lat
            lon
          }
          trip {
            id
            gtfsId
            tripShortName
            tripHeadsign
          }
          route {
            shortName
            longName
            color
            textColor
          }
        }
      }
    }
  }
`;
