import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, AlertController } from '@ionic/angular';
import localforage from 'localforage';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './settings.page.html'
})
export class SettingsPage {
  constructor(private alertCtrl: AlertController, private storage: StorageService) {}

  async clearAll(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Supprimer tout',
      message: 'Voulez-vous supprimer toutes les photos et métadonnées ?',
      buttons: [
        { text: 'Annuler', role: 'cancel' },
        {
          text: 'Supprimer',
          handler: async () => {
            // Clear photo files (best-effort)
            const list = (await localforage.getItem<any[]>('photos_list')) ?? [];
            for (const p of list) {
              try {
                await this.storage.deleteFile(p.filePath);
              } catch (e) {
                // ignore per file
              }
            }
            await localforage.clear();
          }
        }
      ]
    });
    await alert.present();
  }
}
