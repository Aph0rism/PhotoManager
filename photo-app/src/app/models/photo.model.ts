export interface UserPhoto {
  id: string; // identifiant unique (timestamp string)
  filepath?: string; // anciennement utilisé, peut rester pour compatibilité
  webviewPath?: string; // data URL ou URL affichable
  liked?: boolean; // état like
  createdAt?: number; // timestamp ms
  lat?: number | null; // latitude si dispo
  lng?: number | null; // longitude si dispo
}
