import { Component, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import * as L from 'leaflet';
import { PhotoService } from '../../services/photo.service';
import { Photo } from '../../models/photo.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss']
})
export class MapPage implements AfterViewInit {
  map!: L.Map;
  photos: Photo[] = [];

  constructor(private photoService: PhotoService) {}

  async ngAfterViewInit(): Promise<void> {
    await this.photoService.load();
    this.photos = this.photoService.getAll();
    this.initMap();
    await this.addMarkers();
  }

  initMap(): void {
    this.map = L.map('map').setView([48.8566, 2.3522], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OSM contributors'
    }).addTo(this.map);
  }

  private async addMarkers(): Promise<void> {
    for (const p of this.photos) {
      if (p.latitude && p.longitude) {
        const marker = L.marker([p.latitude, p.longitude]).addTo(this.map);
        const src = await this.photoService.getPhotoSrc(p);
        const popupContent = `<div style="text-align:center"><img src="${src}" style="width:120px;height:auto;border-radius:6px"/><div style="margin-top:6px">${p.timestamp}</div></div>`;
        marker.bindPopup(popupContent);
      }
    }
  }
}
