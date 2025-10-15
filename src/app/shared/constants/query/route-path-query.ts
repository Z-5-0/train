export const ROUTE_PATH_QUERY: string = `
  query Plan(
    $fromPlace: String!,
    $toPlace: String!,
    $date: String!,
    $time: String!,
    $modes: [TransportMode],
    $distributionChannel: String!,
    $distributionSubChannel: String!,
    $numItineraries: Int!,
    $walkSpeed: Float,
    $minTransferTime: Int,
    $arriveBy: Boolean,
    $transitPassFilter: [String],
    $comfortLevels: [String],
    $searchParameters: [String],
    $banned: InputBanned
  ) {
    plan(
      fromPlace: $fromPlace,
      toPlace: $toPlace,
      date: $date,
      time: $time,
      transportModes: $modes,
      locale: "en",
      numItineraries: $numItineraries,
      distributionChannel: $distributionChannel,
      distributionSubChannel: $distributionSubChannel,
      walkSpeed: $walkSpeed,
      minTransferTime: $minTransferTime,
      arriveBy: $arriveBy,
      transitPassFilter: $transitPassFilter,
      comfortLevels: $comfortLevels,
      searchParameters: $searchParameters,
      banned: $banned
    ) {
      itineraries {
        startTime
        endTime
        waitingTime
        walkTime
        legs {
          mode
          from { lat lon name stop { gtfsId } }
          to { lat lon name stop { gtfsId } }
          legGeometry { points length }
          route { shortName longName color textColor mode id }
          trip { gtfsId id tripHeadsign route { shortName color } }
          realTime
          departureDelay
          arrivalDelay
          startTime
          endTime
        }
      }
      routingWarnings
      routingErrors { code description }
    }
  }
`;
