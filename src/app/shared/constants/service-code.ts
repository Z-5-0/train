export const SERVICE_CODE: Record<number, { index: number, icon: string; color: string }> = {
    0: { index: 11, icon: 'fa-fw fa-solid fa-xmark', color: '--color-error' },                   // MISSING CODE
    168: { index: 8, icon: 'fa-fw fa-solid fa-clock', color: '--color-warning' },               // Train does not wait for connection
    197: { index: 5, icon: 'fa-fw fa-solid fa-chair', color: '--color-warning' },               // Seat reservation compulsory
    200: { index: 7, icon: 'fa-fw fa-solid fa-map', color: '--color-info' },                    // Domestic travel
    213: { index: 1, icon: 'fa-fw fa-solid fa-bicycle', color: '--color-success' },             // Bicycle transport
    222: { index: 0, icon: 'fa-fw fa-solid fa-2', color: '--color-info' },                      // Second class
    223: { index: 2, icon: 'fa-fw fa-solid fa-wheelchair', color: '--color-success' },          // Wheelchair
    249: { index: 9, icon: 'fa-fw fa-solid fa-ticket', color: '--color-success' },              // BudapestPass
    324: { index: 3, icon: 'fa-fw fa-solid fa-snowflake', color: '--color-info' },              // Air-conditioned
    339: { index: 4, icon: 'fa-fw fa-solid fa-route', color: '--color-warning' },               // Long-distance train
    406: { index: 6, icon: 'fa-fw fa-solid fa-bell-concierge', color: '--color-warning' },        // Reservation not possible
    557: { index: 10, icon: 'fa-fw fa-solid fa-ticket-simple', color: '--color-success' }        // HungaryPass
}