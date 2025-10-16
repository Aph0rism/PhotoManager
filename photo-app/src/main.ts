import { enableProdMode, APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppComponent } from './app/app.component';
import { PermissionService } from './app/services/permission.service';
import { appRoutes } from './app/app.routes';

import { defineCustomElements } from '@ionic/pwa-elements/loader';

// initialiser les pwa elements pour la version web
defineCustomElements(window);

export function initAppFactory(perm: PermissionService) {
  return () => perm.requestAllPermissions();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(IonicModule.forRoot()),
    provideRouter(appRoutes),
    {
      provide: APP_INITIALIZER,
      useFactory: initAppFactory,
      deps: [PermissionService],
      multi: true
    }
  ]
}).catch(err => console.error(err));
