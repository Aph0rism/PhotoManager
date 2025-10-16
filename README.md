# PhotoManager

PhotoManager est une application cross‑platform (Web desktop/mobile + Android) de gestion de photos, développée avec Angular (standalone components), Ionic et Capacitor. Elle fournit les fonctionnalités de base suivantes :
- Prendre des photos (caméra native / fallback navigateur via input file).
- Stocker les photos et métadonnées (date, position, liked).
- Visualiser une galerie réactive (desktop & mobile).
- Voir une photo en grand avec ses métadonnées, liker, supprimer.
- Afficher les photos géolocalisées sur une carte (Leaflet).
- Supporter stockage adapté par plateforme : IndexedDB (localForage) pour web/desktop, Filesystem pour mobile natif.
- Demander les permissions importantes au démarrage (caméra, géolocalisation) sur plateformes natives.

Objectifs du projet
- Fournir une base solide et moderne pour une application de gestion de photos cross‑platform.
- Supporter un développement TypeScript strict (strictNullChecks, strictTemplates).
- Offrir un bon comportement sur desktop (fallback) et sur Android (plugin Capacitor + gestion des permissions).
- Être facile à étendre (SQLite, sync cloud, thumbnails, partage...).

Table des matières
- Installation rapide
- Architecture & organisation du code
- Développement & workflow
- Permissions & Android
- Comportement web vs natif
- Debug / troubleshooting
- Améliorations possibles
- Licence & contact

---

## Installation rapide

Prérequis :
- Node.js (>= 18)
- npm
- Android Studio (pour builds Android)
- ionic CLI (global)

Commandes (à exécuter dans l'ordre) :

1. Installer Ionic CLI (si nécessaire)
```bash
npm install -g @ionic/cli
```

2. Créer le projet (si vous partez de zéro)
```bash
ionic start photo-app blank --type=angular --capacitor
cd photo-app
```

3. Installer Capacitor + plugins et dépendances
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/camera @capacitor/filesystem @capacitor/geolocation @capacitor/preferences
npm install localforage leaflet uuid
npm install --save-dev @types/leaflet
```

4. Ajouter la plateforme Android (si besoin)
```bash
npx cap add android
```

5. Build + sync avant d'ouvrir Android Studio
```bash
npm run build
npx cap sync
npx cap open android
```

6. Lancer en développement sur navigateur (web / desktop)
```bash
ionic serve
```

Flux rapide pour itérations Android :
```bash
npm run build
npx cap copy android
npx cap sync android
npx cap open android
```

---

## Architecture & fichiers clés

Principes
- Angular standalone components (pas de NgModule).
- Services singletons (providedIn: 'root') : PermissionService, CameraService, StorageService, PhotoService.
- strict TypeScript : tsconfig strict activé (strictNullChecks, strictTemplates).
- Persistence par plateforme : localForage (IndexedDB) pour web/Desktop, Filesystem (Capacitor) pour mobile.
- Fallback automatique pour la prise de photo sur web via un input type="file".

Fichiers importants (présents dans le projet)
- src/main.ts — bootstrap Angular, provideRouter, APP_INITIALIZER (PermissionService).
- src/app/app.routes.ts — routes lazy-load (gallery, photo/:id, map, settings).
- src/app/models/photo.model.ts — modèle Photo.
- src/app/services/permission.service.ts — demande permissions au démarrage (mobile only).
- src/app/services/camera.service.ts — utilise Camera plugin, fallback input-file sur web, conversion blob->base64.
- src/app/services/storage.service.ts — abstraction storage localForage + Filesystem.
- src/app/services/photo.service.ts — gestion métadonnées photos.
- src/app/pages/*.page.ts/.html/.scss — Gallery, PhotoDetail, Map, Settings pages.
- capacitor.config.ts — configuration Capacitor.

Structure de dossier proposée
- src/
  - app/
    - models/
      - photo.model.ts
    - services/
      - permission.service.ts
      - camera.service.ts
      - storage.service.ts
      - photo.service.ts
    - pages/
      - gallery.page.ts/.html/.scss
      - photo-detail.page.ts/.html/.scss
      - map.page.ts/.html/.scss
      - settings.page.ts/.html
    - app.routes.ts
    - app.component.ts/.html
  - main.ts
- capacitor.config.ts
- tsconfig.json

---

## Comportement web vs natif (résumé pratique)

- Web / Desktop :
  - Pas de permissions runtime centralisées au bootstrap (navigateur gère au besoin).
  - Stockage : IndexedDB via localForage. Les images sont stockées en base64 ou en clé localForage.
  - Prise de photo : si Capacitor Camera n'est pas disponible ou échoue sur web, on déclenche automatiquement un input type="file" (capture="environment" si mobile browser) pour l'utilisateur.
  - Avantage : fonctionne sur desktop sans plugin natif.

- Mobile natif (Android/iOS) :
  - On utilise Capacitor Camera + Filesystem (Filesystem.writeFile) pour sauvegarder les fichiers en Directory.Data.
  - PermissionService (appelé via APP_INITIALIZER) demande Camera et Geolocation au démarrage (best-effort).
  - Sur Android 10+ / 13+, attention au scoped storage et aux nouvelles permissions médias (READ_MEDIA_IMAGES). Il peut être nécessaire d'ajouter les permissions dans AndroidManifest.xml et gérer runtimes additionnels selon targetSdk.

---

## Permissions & AndroidManifest (snippets importants)

Ajouter au AndroidManifest (android/app/src/main/AndroidManifest.xml) selon besoin :

```xml
<!-- camera -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- storage/media (Android 13+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<!-- Optional legacy read/write (older android versions) -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

Notes :
- Capacitor plugins vont déclencher des prompts runtime (et PermissionService tente de les initialiser au start).
- Pour Android 13 (API 33+) utilisez READ_MEDIA_IMAGES pour accéder aux images du media store. Le runtime pour cette permission peut nécessiter code natif ou plugin.

---

## Development & bonnes pratiques

TypeScript strict
- Le projet est configuré en strict mode pour éviter les erreurs runtime.
- Toujours vérifier la présence d'un param route avant usage (ex.: route.paramMap.subscribe + check id).
- Evitez les assertions non-null (!) autant que possible ; préférez la logique de redirection si resource manquante.

UI / UX
- Utiliser un FAB pour l'action "prendre une photo".
- Grille responsive pour la galerie (CSS grid, minmax) pour supporter desktop et mobile.
- Modal / page dédiée pour la vue détaillée.

Testing
- Sur web : ionic serve — tester le fallback input-file (simuler mobile via devtools).
- Sur Android : npx cap open android et lancer sur device réel pour tester caméra, permissions et Filesystem.

---

## Debug / Troubleshooting rapide

- Photo n'apparaît pas sur Android après prise : vérifier que vous utilisez Capacitor.convertFileSrc(savedUri) pour obtenir un src webview-friendly ; vérifier aussi que le chemin est valide.
- Permissions refusées : révoquer/autoriser dans les paramètres de l'app sur l'appareil, ou réinstaller l'app pour re-provoquer le prompt.
- Camera.getPhoto échoue sur navigateur : le plugin peut ne pas être disponible dans le navigateur ; le fallback input-file gère ce cas.
- Problèmes IndexedDB/localForage : vérifier la console du navigateur, effacer storage (application > IndexedDB) et relancer.

---

Annexes : commandes récapitulatives
```bash
# installer ionic
npm install -g @ionic/cli

# initialiser projet (si besoin)
ionic start photo-app blank --type=angular --capacitor
cd photo-app

# dépendances
npm install @capacitor/core @capacitor/cli
npm install @capacitor/camera @capacitor/filesystem @capacitor/geolocation @capacitor/preferences
npm install localforage leaflet uuid
npm install --save-dev @types/leaflet

# ajouter android
npx cap add android

# build + sync
npm run build
npx cap sync
npx cap open android

# développement web
ionic serve
```
