import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonRouterOutlet } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { PhotoService } from '../../services/photo.service';
import { CameraService } from '../../services/camera.service';
import { Photo } from '../../models/photo.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss']
})
export class GalleryPage implements OnInit {
  photos: Photo[] = [];
  photoSrcMap = new Map<string, string>(); // cache for computed srcs (async)

  constructor(private photoService: PhotoService, private cameraService: CameraService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.photoService.load();
    this.photos = this.photoService.getAll();
    await this.buildSrcCache();
  }

  private async buildSrcCache(): Promise<void> {
    this.photoSrcMap.clear();
    for (const p of this.photos) {
      try {
        const src = await this.photoService.getPhotoSrc(p);
        if (src) this.photoSrcMap.set(p.id, src);
      } catch (e) {
        console.warn('buildSrcCache error', e);
      }
    }
  }

  async takePhoto(): Promise<void> {
    const p = await this.cameraService.takePhoto();
    if (p) {
      await this.photoService.add(p);
      // update view
      this.photos = this.photoService.getAll();
      const src = await this.photoService.getPhotoSrc(p);
      if (src) this.photoSrcMap.set(p.id, src);
    }
  }

  openDetail(photo: Photo): void {
    this.router.navigate(['/photo', photo.id]);
  }

  getSrc(photo: Photo): string {
    return this.photoSrcMap.get(photo.id) ?? '';
  }
}
