import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo as CapacitorPhoto } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from './storage.service';
import { Photo } from '../models/photo.model';

/**
 * CameraService :
 * - takePhoto() : tente Camera.getPhoto() sur toutes plateformes.
 *    - si web et Camera.getPhoto échoue ou n'est pas disponible -> fallback automatique via <input type="file"> créé dynamiquement.
 * - convertit Blob -> base64, sauvegarde via StorageService.saveFileBase64 et renvoie Photo metadata
 */

@Injectable({ providedIn: 'root' })
export class CameraService {
  constructor(private storage: StorageService) {}

  async takePhoto(): Promise<Photo | null> {
    try {
      const platform = Capacitor.getPlatform();

      // try to get geolocation (best-effort)
      let coords;
      try {
        await Geolocation.requestPermissions();
        coords = await Geolocation.getCurrentPosition();
      } catch {
        coords = undefined;
      }

      let captured: CapacitorPhoto | null = null;
      let base64Data: string | null = null;
      let fileName = `${uuidv4()}.jpeg`;

      // Attempt Camera plugin
      try {
        const photo = await Camera.getPhoto({
          resultType: CameraResultType.Uri, // uri is cross-platform friendly
          source: CameraSource.Camera,
          quality: 80,
          allowEditing: false
        });
        captured = photo;
      } catch (err) {
        // If camera plugin fails on web or plugin not available, we'll fallback
        captured = null;
      }

      if (captured && (captured.webPath || captured.path)) {
        // fetch the blob from webPath or path
        const url = captured.webPath ?? (captured.path as string);
        const response = await fetch(url);
        const blob = await response.blob();
        base64Data = await this.blobToBase64NoPrefix(blob);
      } else {
        // Fallback: create a hidden input and await file selection (web)
        if (platform === 'web') {
          const file = await this.promptFilePicker();
          if (!file) {
            return null;
          }
          const blob = file;
          base64Data = await this.blobToBase64NoPrefix(blob);
          // Perhaps set a more friendly filename using original file name
          fileName = `${uuidv4()}-${(file as any).name ?? 'photo'}.jpeg`;
        } else {
          // On native, if Camera plugin failed unexpectedly, bail out
          return null;
        }
      }

      if (!base64Data) {
        return null;
      }

      // Save using StorageService (handles web vs native)
      const storedRef = await this.storage.saveFileBase64(uuidv4(), base64Data, fileName);

      // Build photo metadata. webviewPath will be resolved by PhotoService.getPhotoSrc
      const photo: Photo = {
        id: uuidv4(),
        filePath: storedRef,
        webviewPath: (Capacitor.getPlatform() === 'web') ? `data:image/jpeg;base64,${base64Data}` : undefined,
        timestamp: new Date().toISOString(),
        latitude: coords?.coords?.latitude,
        longitude: coords?.coords?.longitude,
        liked: false,
        filename: fileName
      };

      return photo;
    } catch (err) {
      console.error('CameraService.takePhoto error', err);
      return null;
    }
  }

  private async promptFilePicker(): Promise<File | null> {
    return new Promise<File | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.style.position = 'fixed';
      input.style.left = '-10000px';
      document.body.appendChild(input);

      input.addEventListener('change', async () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        document.body.removeChild(input);
        resolve(file);
      });

      input.click();
      // if user cancels, 'change' might not fire — keep it simple: user must choose or close dialog
    });
  }

  private async blobToBase64NoPrefix(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = () => {
        const result = reader.result as string | null;
        if (!result) {
          reject(new Error('empty file read'));
          return;
        }
        // result is like "data:image/jpeg;base64,...." -> remove prefix
        const commaIndex = result.indexOf(',');
        resolve(commaIndex >= 0 ? result.substring(commaIndex + 1) : result);
      };
      reader.readAsDataURL(blob);
    });
  }
}
