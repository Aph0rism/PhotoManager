```markdown
# PhotoApp - Starter (Ionic + Angular standalone + Capacitor)

Objectif
- Application de gestion photos cross-platform : web desktop/mobile + Android.
- Fonctionnalités : prise photo, galerie, vue détaillée (métadata), carte (marqueurs), like, suppression.
- Fallback web : input file automatique si Camera plugin non dispo.
- Persistance : localForage (IndexedDB) pour web/desktop ; Filesystem pour fichiers sur mobile.

Prerequis locaux
- Node.js >= 18
- npm
- Android Studio (pour build Android)
- ionic CLI (global)

Installation & démarrage (depuis zéro)
1) Installer Ionic CLI global (si pas déjà)
   npm install -g @ionic/cli

2) Créer le projet Ionic (si tu pars de zéro)
   ionic start photo-app blank --type=angular --capacitor
   cd photo-app

3) Remplacer ou ajouter les fichiers fournis dans src/ (colle les fichiers fournis dans ce chat)

4) Installer dépendances
   npm install
   npm install @capacitor/core @capacitor/cli @capacitor/camera @capacitor/filesystem @capacitor/geolocation @capacitor/preferences localforage leaflet uuid

   (dev) types pour Leaflet :
   npm install --save-dev @types/leaflet

5) Build + sync Capacitor
   npm run build
   npx cap sync

6) Lancer sur navigateur (web / desktop)
   npm start
   // ouvre http://localhost:8100 et tu peux tester la prise via input-file fallback

7) Lancer sur Android (réel ou émulateur)
   npx cap open android
   // depuis Android Studio : run sur émulateur ou device connecté
   // vérifier permissions (la PermissionService demande camera + geo au start)

Notes importantes
- TypeScript strict : tsconfig.json est en strict mode. Gère les nulls/undefineds.
- Permissions : PermissionService demande camera+geo au démarrage sur plateformes natives. Sur web, rien n’est demandé au boot (le navigateur demandera à l’usage).
- Android : pour Android 13+ ajoute READ_MEDIA_IMAGES au AndroidManifest si tu veux que les images soient accessibles via MediaStore. Gestion runtime supplémentaire peut être nécessaire selon targetSdkVersion.
- Performances : pour beaucoup d’images, envisager de générer thumbnails et d’utiliser SQLite ou stockage cloud.
```
