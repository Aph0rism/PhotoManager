import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { PhotoService } from '../../services/photo.service';
import { UserPhoto } from '../../models/photo.model';

@Component({
  selector: 'app-photo-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule   // <-- fournit tous les composants Ionic et le provider ModalController
  ],
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss']
})
export class PhotoModalPage implements OnInit {
  @Input() photos: UserPhoto[] = [];
  @Input() startIndex = 0;

  currentIndex = 0;

  constructor(private modalCtrl: ModalController, private photoService: PhotoService) {}

  ngOnInit(): void {
    this.currentIndex = Math.min(Math.max(0, this.startIndex || 0), Math.max(0, (this.photos?.length || 1) - 1));
  }

  get currentPhoto(): UserPhoto | undefined {
    return this.photos && this.photos.length ? this.photos[this.currentIndex] : undefined;
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  async toggleLike() {
    const p = this.currentPhoto;
    if (!p) return;
    await this.photoService.toggleLike(p.id);
    p.liked = !p.liked;
  }

  async deletePhoto() {
    const p = this.currentPhoto;
    if (!p) return;
    await this.photoService.deletePhoto(p.id);
    this.photos.splice(this.currentIndex, 1);
    if (this.photos.length === 0) {
      this.dismiss();
      return;
    }
    if (this.currentIndex >= this.photos.length) {
      this.currentIndex = this.photos.length - 1;
    }
  }

  prev() {
    if (!this.photos || this.photos.length === 0) return;
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
  }

  next() {
    if (!this.photos || this.photos.length === 0) return;
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
  }

  formatDate(ms?: number) {
    return ms ? new Date(ms).toLocaleString() : '—';
  }
}
