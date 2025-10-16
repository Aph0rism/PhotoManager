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
    try {
      const platform = Capacitor.getPlatform();

      if (platform === 'web') {
        const dataUrl = await this.storage.readFileAsDataUrl(photo.filePath);
        if (!dataUrl || typeof dataUrl !== 'string') {
          console.warn('getPhotoSrc: invalid web src for', photo?.id, dataUrl);
          return '';
        }
        return dataUrl;
      } else {
        if (photo.filePath) {
          const convert = (Capacitor as any).convertFileSrc as ((p: string) => string) | undefined;
          if (typeof convert === 'function') {
            const out = convert(photo.filePath);
            if (typeof out === 'string') return out;
            console.warn('getPhotoSrc: convertFileSrc returned non-string', out);
          }
          return typeof photo.webviewPath === 'string' ? photo.webviewPath : (photo.filePath ?? '');
        }
        return typeof photo.webviewPath === 'string' ? photo.webviewPath : '';
      }
    } catch (err) {
      console.error('getPhotoSrc error', err, photo);
      return '';
    }
  }
}
