import { Injectable } from '@angular/core';
import localforage from 'localforage';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * StorageService :
 * - utilise localForage (IndexedDB) pour metadata & données web/desktop
 * - sur mobile (hybrid) : stocke le fichier via Filesystem et garde metadata dans localForage
 *
 * Keys:
 *  - 'photos_list' -> JSON array of Photo metadata
 *  - 'photo:{id}' -> for web: base64 data (string)
 */

@Injectable({ providedIn: 'root' })
export class StorageService {
  private photosListKey = 'photos_list';

  constructor() {
    localforage.config({
      name: 'photo-app',
      storeName: 'photo_store'
    });
  }

  // metadata
  async getPhotosList(): Promise<any[]> {
    const list = await localforage.getItem<any>(this.photosListKey);
    return Array.isArray(list) ? list : [];
  }

  async savePhotosList(list: any[]): Promise<void> {
    await localforage.setItem(this.photosListKey, list);
  }

  // save raw base64 (web) or write to Filesystem (native)
  async saveFileBase64(id: string, base64Data: string, filename: string): Promise<string> {
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      const key = `photo:${id}`;
      await localforage.setItem(key, { data: base64Data, filename });
      return key; // key as filePath for reference
    } else {
      // native: write to Filesystem
      const filePath = `photos/${filename}`;
      const saved = await Filesystem.writeFile({
        path: filePath,
        data: base64Data,
        directory: Directory.Data
      });
      return saved.uri; // filesystem uri
    }
  }

  async readFileAsDataUrl(filePathOrKey: string | undefined): Promise<string | undefined> {
    if (!filePathOrKey) {
      return undefined;
    }
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      const item = await localforage.getItem<{ data: string }>(filePathOrKey);
      if (!item || !item.data) {
        return undefined;
      }
      return `data:image/jpeg;base64,${item.data}`;
    } else {
      // native: convert file uri to web path usable in <img>
      // Capacitor.convertFileSrc used by consumer
      return filePathOrKey;
    }
  }

  async deleteFile(filePathOrKey: string | undefined): Promise<void> {
    if (!filePathOrKey) return;
    const platform = Capacitor.getPlatform();
    if (platform === 'web') {
      await localforage.removeItem(filePathOrKey);
    } else {
      // native: attempt to delete file
      try {
        // filePathOrKey is uri -> extract path relative if needed; Filesystem.deleteFile expects path param
        // We try a best-effort delete using same path format we wrote earlier.
        // If filePathOrKey is something like 'file:///data/data/.../files/photos/xxx', extract path after '/files/'
        const pathMatch = filePathOrKey.match(/\/files\/(.*)$/);
        const path = pathMatch ? pathMatch[1] : undefined;
        if (path) {
          await Filesystem.deleteFile({ path, directory: Directory.Data });
        } else {
          // fallback: try to delete using given string as path
          await Filesystem.deleteFile({ path: filePathOrKey, directory: Directory.Data });
        }
      } catch (e) {
        console.warn('deleteFile: delete failed (best-effort)', e);
      }
    }
  }
}
