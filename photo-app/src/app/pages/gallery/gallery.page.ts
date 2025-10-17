import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonImg,
  IonTitle,
  IonToolbar,
  AlertController
} from '@ionic/angular/standalone';
import { PhotoService } from '../../services/photo.service';
import { UserPhoto } from '../../models/photo.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonFab,
    IonFabButton,
    IonIcon,
    IonImg
  ],
  templateUrl: './gallery.page.html',
  styleUrls: ['./gallery.page.scss']
})
export class GalleryPage implements OnInit {
  constructor(
    public photoService: PhotoService,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    await this.photoService.loadSaved();
  }

  async addPhotoToGallery() {
    await this.photoService.addNewToGallery();
  }

  formatDate(ms?: number) {
    return ms ? new Date(ms).toLocaleString() : '—';
  }

  // Ouvre un panneau de détails quand l'utilisateur clique sur une vignette.
  // Utilise AlertController avec HTML (aperçu, date, coords) et actions (like, supprimer).
  async onPhotoClick(photo: UserPhoto) {
    // Build message HTML with safe inline styles (AlertController supports HTML string)
    const dateStr = photo.createdAt ? new Date(photo.createdAt).toLocaleString() : 'Inconnue';
    const coords = (photo.lat != null && photo.lng != null) ? `${photo.lat.toFixed(5)}, ${photo.lng.toFixed(5)}` : 'Non disponible';
    const imgHtml = photo.webviewPath ? `<div style="text-align:center;margin-bottom:10px"><img src="${photo.webviewPath}" style="max-width:100%;max-height:40vh;border-radius:8px;object-fit:contain"/></div>` : '';

    const message = `
      ${imgHtml}
      <div><strong>Date :</strong> ${dateStr}</div>
      <div style="margin-top:8px"><strong>Coordonnées :</strong> ${coords}</div>
    `;

    const alert = await this.alertCtrl.create({
      header: 'Détails de la photo',
      message,
      cssClass: 'photo-details-alert',
      buttons: [
        {
          text: photo.liked ? 'Retirer le like' : 'Liker',
          handler: async () => {
            await this.photoService.toggleLike(photo.id);
            // update local state immediately (photo reference is the same object from array)
            photo.liked = !photo.liked;
          }
        },
        {
          text: 'Supprimer',
          role: 'destructive',
          handler: async () => {
            await this.photoService.deletePhoto(photo.id);
          }
        },
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }
}
