import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app/app.component';
import { appRoutes } from './app/app.routes';
import { PhotoService } from './app/services/photo.service';
import { Capacitor } from '@capacitor/core';

async function initPwaElementsIfWeb(): Promise<void> {
  try {
    if (Capacitor.getPlatform() === 'web' && typeof window !== 'undefined' && 'customElements' in window) {
      // dynamic ESM import (no require) — safe for TypeScript / Angular builds
      const mod = await import('@ionic/pwa-elements/loader');
      if (mod && typeof mod.defineCustomElements === 'function') {
        try {
          mod.defineCustomElements(window);
        } catch (err) {
          console.warn('defineCustomElements failed (ignored):', err);
        }
      }
    }
  } catch (e) {
    // don't block bootstrap if import or call fails
    console.warn('PWA elements loader skipped or failed:', e);
  }
}

/**
 * Initialise l'application en chargeant les photos sauvegardées.
 * PhotoService.loadSaved peut retourner void ou Promise<void>.
 */
export function initAppFactory(photoService: PhotoService) {
  return () => {
    try {
      const result = photoService.loadSaved?.();
      return result instanceof Promise ? result : Promise.resolve();
    } catch (err) {
      console.error('initAppFactory: loadSaved failed', err);
      return Promise.resolve();
    }
  };
}

(async () => {
  // Ensure pwa-elements (web camera support) is registered before bootstrap on web
  await initPwaElementsIfWeb();

  bootstrapApplication(AppComponent, {
    providers: [
      importProvidersFrom(IonicModule.forRoot()),
      provideRouter(appRoutes),
      {
        provide: APP_INITIALIZER,
        useFactory: initAppFactory,
        deps: [PhotoService],
        multi: true
      }
    ]
  }).catch(err => console.error(err));
})();
