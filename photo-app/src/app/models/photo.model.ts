export interface Photo {
  id: string;
  filePath?: string; // for native: filesystem uri or for web: localForage key
  webviewPath?: string; // usable in <img src>
  timestamp: string;
  latitude?: number;
  longitude?: number;
  liked?: boolean;
  filename?: string;
}
