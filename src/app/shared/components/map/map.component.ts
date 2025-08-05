import { Component } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent {
  private map!: L.Map
  markers: L.Marker[] = [
    L.marker([47.497913, 19.040236])
  ];

  ngAfterViewInit() {
    this.initMap();
    this.centerMap();
  }

  private initMap() {
    if (this.map) return;

    const baseMapURl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    this.map = L.map('map');
    L.tileLayer(baseMapURl).addTo(this.map);

    // Figyeljük a drag eseményeket
    this.map.on('dragstart', () => {
      console.log('Térkép húzás elkezdődött');
      // Itt tilthatod le a carouselt pl.:
      // this.carouselSwipeEnabled = false;
    });

    this.map.on('dragend', () => {
      console.log('Térkép húzás véget ért');
      // Visszakapcsolod a carouselt
      // this.carouselSwipeEnabled = true;
    });
  }


  private centerMap() {
    // Create a boundary based on the markers
    const bounds = L.latLngBounds(this.markers.map(marker => marker.getLatLng()));

    // Fit the map into the boundary
    this.map.fitBounds(bounds);
  }
}
