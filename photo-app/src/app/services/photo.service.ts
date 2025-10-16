import { Injectable } from '@angular/core';
import { Photo } from '../models/photo.model';
import localforage from 'localforage';
import { StorageService } from './storage.service';
import { Capacitor } from '@capacitor/core';

/**
 * PhotoService:
 * - gestion des métadonnées (stockées dans localForage sous 'photos_list')
 * - getPhotoSrc(photo) : renvoie un src utilisable dans <img>
 */
const PHOTOS_KEY = 'photos_list';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private photos: Photo[] = [];

  constructor(private storage: StorageService) {}

  async load(): Promise<Photo[]> {
    const list = await localforage.getItem<Photo[]>(PHOTOS_KEY);
    this.photos = Array.isArray(list) ? list : [];
    return this.photos;
  }

  getAll(): Photo[] {
    return this.photos;
  }

  getById(id: string): Photo | undefined {
    return this.photos.find(p => p.id === id);
  }

  async add(photo: Photo): Promise<void> {
    this.photos.unshift(photo);
    await localforage.setItem(PHOTOS_KEY, this.photos);
  }

  async update(photo: Photo): Promise<void> {
    const idx = this.photos.findIndex(p => p.id === photo.id);
    if (idx === -1) {
      throw new Error('Photo not found');
    }
    this.photos[idx] = photo;
    await localforage.setItem(PHOTOS_KEY, this.photos);
  }

  async remove(photoId: string): Promise<void> {
    const toRemove = this.photos.find(p => p.id === photoId);
    if (toRemove) {
      // delete file
      await this.storage.deleteFile(toRemove.filePath);
      this.photos = this.photos.filter(p => p.id !== photoId);
      await localforage.setItem(PHOTOS_KEY, this.photos);
    }
  }

  /**
   * Retourne la source utilisable dans <img [src]="..."> en tenant compte
   * des différences web / natif.
   *
   * - Sur web : on lit la dataURL via StorageService.readFileAsDataUrl
   * - Sur natif : on convertit l'uri filesystem en webview-friendly via Capacitor.convertFileSrc si disponible
   */
  async getPhotoSrc(photo: Photo): Promise<string> {
    if (!photo) return '';
    const platform = Capacitor.getPlatform();

    if (platform === 'web') {
      // sur le web, StorageService.readFileAsDataUrl renvoie data:image/jpeg;base64,...
      const dataUrl = await this.storage.readFileAsDataUrl(photo.filePath);
      return dataUrl ?? '';
    } else {
      // natif (android / ios)
      if (photo.filePath) {
        // Filesystem.writeFile retourne généralement un URI (ex: file:///.../files/photos/xxx)
        // Capacitor.convertFileSrc transforme cette URI en un chemin utilisable dans <img src="...">
        // On utilise Capacitor.convertFileSrc si présent, sinon on renvoie la filePath en fallback.
        try {
          // Utilisation sûre : convertFileSrc peut ne pas exister selon version/types, tester avant d'appeler
          const convert = (Capacitor as any).convertFileSrc as ((path: string) => string) | undefined;
          if (typeof convert === 'function') {
            return convert(photo.filePath);
          }
          // Fallback: si convertFileSrc absent, essaye de renvoyer la webviewPath si disponible,
          // sinon la filePath brute (certains moteurs l'accepteront)
          return photo.webviewPath ?? photo.filePath;
        } catch (e) {
          console.warn('getPhotoSrc: convertFileSrc failed, fallback to filePath', e);
          return photo.webviewPath ?? photo.filePath;
        }
      }
      // dernier fallback : webviewPath
      return photo.webviewPath ?? '';
    }
  }
}
