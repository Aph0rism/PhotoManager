import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { PhotoService } from './app/services/photo.service';

// IMPORTANT: loader PWA elements pour la caméra web (Ionic)
import { defineCustomElements } from '@ionic/pwa-elements/loader';
defineCustomElements(window);

/**
 * Initialise l'application en chargeant les photos sauvegardées (ou en demandant les permissions)
 * Assure-toi que PhotoService expose une méthode `loadSaved()` qui retourne void | Promise<void>
 */

export function initAppFactory(photoService: PhotoService) {
  return () => photoService.addNewToGallery?.();
}


bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(IonicModule.forRoot()),
    provideRouter(appRoutes),
    PhotoService,
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFactory,
      deps: [PhotoService],
      multi: true
    }
  ]
}).catch(err => console.error(err));
