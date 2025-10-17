import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { PhotoService } from '../../services/photo.service';
import { UserPhoto } from '../../models/photo.model';
import { PhotoModalPage } from '../modal/modal.page';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,     // <-- importe IonicModule (fournit composants + providers)
    PhotoModalPage   // <-- ton modal standalone (si présent)
  ],
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss']
})
export class GalleryPage implements OnInit {
  constructor(
    public photoService: PhotoService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async addPhotoToGallery() {
    await this.photoService.addNewToGallery();
  }

  async openPhotoModalAt(index: number) {
    const modal = await this.modalCtrl.create({
      component: PhotoModalPage,
      componentProps: { photos: this.photoService.photos, startIndex: index },
      cssClass: 'photo-modal-bottom'
    });
    await modal.present();
    await modal.onWillDismiss();
  }

  formatDate(ms?: number) {
    return ms ? new Date(ms).toLocaleString() : '';
  }
}
