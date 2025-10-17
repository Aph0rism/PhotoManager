import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { UserPhoto } from "../models/photo.model";

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  public photos: UserPhoto[] = [];
  private STORAGE_KEY = 'photos';
  // taille max base64 acceptée (~4.5MB). Ajuste si nécessaire.
  private MAX_BASE64_SIZE = 4_500_000;

  // Charge les photos persistées (à appeler au démarrage)
  public async loadSaved(): Promise<void> {
    try {
      const ret = await Preferences.get({ key: this.STORAGE_KEY });
      if (!ret.value) {
        this.photos = [];
        return;
      }
      try {
        this.photos = JSON.parse(ret.value) as UserPhoto[];
        if (!Array.isArray(this.photos)) {
          console.warn('[PhotoService] Unexpected photos format, resetting.');
          this.photos = [];
          await Preferences.remove({ key: this.STORAGE_KEY });
        }
      } catch (parseErr) {
        console.warn('[PhotoService] Photos storage corrupted — clearing storage', parseErr);
        this.photos = [];
        await Preferences.remove({ key: this.STORAGE_KEY });
      }
    } catch (err) {
      console.error('[PhotoService] loadSaved error', err);
      this.photos = [];
    }
  }

  // Sauvegarde la liste dans Preferences
  private async savePhotos(): Promise<void> {
    try {
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(this.photos) });
    } catch (err: any) {
      console.error('[PhotoService] savePhotos error', err);
      try {
        console.warn('[PhotoService] Attempting to clear storage key due to save failure.');
        await Preferences.remove({ key: this.STORAGE_KEY });
      } catch (removeErr) {
        console.error('[PhotoService] Failed to remove corrupted storage key', removeErr);
      }
    }
  }

  // Helper : essai de récupérer la position (essaye Capacitor Geolocation puis fallback navigator)
  private async tryGetLocation(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
    // Try Capacitor Geolocation plugin first (asks permission on native)
    try {
      const pos = await Geolocation.getCurrentPosition({ timeout: timeoutMs });
      if (pos && pos.coords) {
        return { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch (e) {
      // ignore and fallback
      console.warn('[PhotoService] Geolocation plugin failed or denied:', e);
    }

    // Fallback to navigator.geolocation (for web/dev)
    if (!('geolocation' in navigator)) return null;

    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          clearTimeout(timer);
          console.warn('[PhotoService] navigator.geolocation failed:', err);
          resolve(null);
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs }
      );
    });
  }

  // Best-effort permission check for camera (non-blocking)
  private async ensureCameraPermission(): Promise<boolean> {
    try {
      if (typeof (Camera as any).checkPermissions === 'function') {
        const status = await (Camera as any).checkPermissions();
        const ok = Object.values(status).some((v: any) => v === 'granted' || v === 'limited');
        if (ok) return true;
        if (typeof (Camera as any).requestPermissions === 'function') {
          const req = await (Camera as any).requestPermissions();
          return Object.values(req).some((v: any) => v === 'granted' || v === 'limited');
        }
      }
    } catch (err) {
      console.warn('[PhotoService] Permission check/request failed (continuing):', err);
    }
    return true;
  }

  // Prend une photo et l'ajoute à la liste (stockée en dataUrl)
  public async addNewToGallery(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      const source = platform === 'web' ? CameraSource.Photos : CameraSource.Camera;

      await this.ensureCameraPermission();

      let captured: Photo | null = null;
      try {
        captured = await Camera.getPhoto({
          resultType: CameraResultType.Base64,
          source,
          quality: 80
        });
      } catch (camErr: any) {
        console.error('[PhotoService] Camera.getPhoto failed:', camErr);
        try { console.error('[PhotoService] camErr details:', JSON.stringify(camErr, Object.getOwnPropertyNames(camErr))); } catch {}
        if (Capacitor.getPlatform() === 'android') {
          console.warn('[PhotoService] On Android emulator make sure virtual camera or gallery is available.');
        }
        return;
      }

      if (!captured) {
        console.warn('[PhotoService] Camera.getPhoto returned no result');
        return;
      }

      const base64 = (captured as any).base64String;
      if (!base64) {
        console.warn('[PhotoService] No base64 returned', captured);
        return;
      }

      if (base64.length > this.MAX_BASE64_SIZE) {
        console.warn(`[PhotoService] Captured image too large (${(base64.length/1_000_000).toFixed(2)} MB). Not saving to Preferences.`);
        return;
      }

      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const id = Date.now().toString();
      const createdAt = Date.now();

      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const pos = await this.tryGetLocation(4000);
        if (pos) { lat = pos.lat; lng = pos.lng; }
      } catch (e) { /* ignore */ }

      this.photos.unshift({ id, filepath: id, webviewPath: dataUrl, liked: false, createdAt, lat, lng });
      await this.savePhotos();
      console.debug('[PhotoService] Photo added, total:', this.photos.length);
    } catch (err) {
      console.error('[PhotoService] addNewToGallery fatal error:', err);
    }
  }

  // Supprime une photo par id
  public async deletePhoto(id: string): Promise<void> {
    const idx = this.photos.findIndex(p => p.id === id);
    if (idx > -1) {
      this.photos.splice(idx, 1);
      await this.savePhotos();
    }
  }

  // Toggle like
  public async toggleLike(id: string): Promise<void> {
    const p = this.photos.find(x => x.id === id);
    if (!p) return;
    p.liked = !p.liked;
    await this.savePhotos();
  }
}
