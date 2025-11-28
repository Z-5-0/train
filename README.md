# Real-Time Transit Viewer

A realtime transit route monitoring application built with modern Angular (v19) which visualizes planned routes, realtime vehicle positions, and trip origins using data from the OpenTripPlanner GraphQL API.

[Train APP](https://z-5-0.github.io/train/)

<br>

<p align="center">
  <img src="https://z-5-0.github.io/train/imgs/app/app.png"
       alt="Screenshot"
       style="height: 500px;">
</p>

<br>

## Features

- Plan public transit routes between any two stops, with multiple alternative options based on user-configured search depth
- Save, reorder, and remove favorite routes for quick access
- View trip summaries, including estimated travel time and required transfers
- Select a route option to access full itinerary details and the interactive map

### Inspect each transit leg:
- vehicle type  
- real-time departure status (on time, delayed, accelerated)  
- scheduled vs. actual times  
- current vehicle position and heading  
- accessibility details (bike allowed, wheelchair access, etc.)  
- service alerts (delays, detours)

### Interactive map view showing:
- the full journey path  
- all stops involved  
- transfer points  
- the user’s current location (if permitted)  
- realtime vehicle locations with direction

- User settings, such as dark/light theme  
- Built-in documentation, legend, and known issues section

<br>

## Tech Stack

- Angular 19
- TypeScript / RxJS
- Leaflet (interactive map)
- TailwindCSS
- SCSS
- Ant Design
- Luxon
- OpenTripPlanner (OTP) GraphQL API
- Node.js + Express proxy server

<br>

## Installation & Running

```bash
npm install
npx ng serve
node proxy.js
```

(The proxy server is required for API communication.)

<br>

## TODO
- Improve mobile layout and responsiveness
- Add multi-language support
- Minor style refinements
- Update font-family
- Fix route-planning anomalies around midnight
- Add more contextual info messages
- Maintain a list of known issues
- Create a full user manual
- Option to show the entire trip path on the map for each vehicle
- Persist map position and zoom level
- Integrate a free/open map 

<br>

## License

This project is licensed under the [GNU General Public License v3.0](./LICENSE).
<br>
Please note that all source code and content is subject to the terms of this license.