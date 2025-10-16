import { Injectable } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Platform, AlertController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  constructor(private platform: Platform, private alertCtrl: AlertController) {}

  async requestAllPermissions(): Promise<void> {
    await this.platform.ready();

    // Only request native permissions on hybrid platforms
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      // Nothing to do: browser handles permissions at usage
      return;
    }

    try {
      // Camera (best-effort; some Capacitor versions open permission on first usage)
      try {
        await Camera.requestPermissions();
      } catch (e) {
        console.warn('Camera permission request failed (may be prompted on usage):', e);
      }

      // Geolocation
      try {
        await Geolocation.requestPermissions();
      } catch (e) {
        console.warn('Geolocation permission request failed:', e);
      }

      // For Android media permissions (Android 13+), add them to AndroidManifest.xml:
      // <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
      // Handling runtime request for READ_MEDIA_IMAGES may require plugin/native code.
    } catch (err) {
      console.error('Error requesting initial permissions', err);
      // Optionally show an informative alert
      const alert = await this.alertCtrl.create({
        header: 'Permissions',
        message: "L'application peut nécessiter l'accès à la caméra et à la position. Vous pourrez autoriser lors du premier usage.",
        buttons: ['OK']
      });
      await alert.present();
    }
  }
}
