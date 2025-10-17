import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
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
        // defensive: ensure array
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
      // if storage seems corrupted or fails repeatedly, attempt to clear and fallback
      try {
        console.warn('[PhotoService] Attempting to clear storage key due to save failure.');
        await Preferences.remove({ key: this.STORAGE_KEY });
      } catch (removeErr) {
        console.error('[PhotoService] Failed to remove corrupted storage key', removeErr);
      }
    }
  }

  // Helper : essai de récupérer la position (navigator.geolocation) avec timeout
  private async tryGetLocation(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
    if (!('geolocation' in navigator)) return null;
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs }
      );
    });
  }

  // Vérifie/demande les permissions caméra/photos si possible (graceful fallback si API différente)
  private async ensureCameraPermission(): Promise<boolean> {
    try {
      // Camera.checkPermissions() peut ne pas exister dans toutes les versions; on protège.
      if (typeof Camera.checkPermissions === 'function') {
        const status = await (Camera as any).checkPermissions();
        // status peut contenir camera / photos / read etc. On considère granted si une permission utile est 'granted'
        const ok = Object.values(status).some((v: any) => v === 'granted' || v === 'limited');
        if (ok) return true;
        // request permissions if possible
        if (typeof (Camera as any).requestPermissions === 'function') {
          const req = await (Camera as any).requestPermissions();
          return Object.values(req).some((v: any) => v === 'granted' || v === 'limited');
        }
      }
    } catch (err) {
      // Ne pas bloquer si checkPermissions échoue, laisser Camera.getPhoto gérer l'erreur.
      console.warn('[PhotoService] Permission check/request failed (continuing):', err);
    }
    return true;
  }

  // Prend une photo et l'ajoute à la liste (stockée en dataUrl)
  // Comportement : CameraSource.Camera sur mobile natif, CameraSource.Photos sur web (file picker)
  public async addNewToGallery(): Promise<void> {
    try {
      const platform = Capacitor.getPlatform();
      const source = platform === 'web' ? CameraSource.Photos : CameraSource.Camera;

      // ensure permissions first (best-effort)
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
        // On Android emulator, la caméra peut être absente → log utile pour l'utilisateur
        if (Capacitor.getPlatform() === 'android') {
          console.warn('[PhotoService] If you run this on an Android emulator, ensure a virtual camera or use an image from the gallery.');
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

      // quick size check: avoid saving extremely large images into Preferences
      if (base64.length > this.MAX_BASE64_SIZE) {
        console.warn(`[PhotoService] Captured image too large (${(base64.length/1_000_000).toFixed(2)} MB). Not saving to Preferences.`);
        // Optionally: downscale or use Filesystem approach here
        return;
      }

      const dataUrl = `data:image/jpeg;base64,${base64}`;
      const id = Date.now().toString();
      const createdAt = Date.now();

      // attempt to get location (best-effort)
      let lat: number | null = null;
      let lng: number | null = null;
      try {
        const pos = await this.tryGetLocation(4000);
        if (pos) {
          lat = pos.lat;
          lng = pos.lng;
        }
      } catch (e) {
        // ignore
      }

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
