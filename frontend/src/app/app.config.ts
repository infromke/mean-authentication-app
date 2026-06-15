import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { AtSign, ChevronDown, Lock, LockOpen, LucideAngularModule, User } from 'lucide-angular';
import { provideToastr } from 'ngx-toastr';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(LucideAngularModule.pick({ User, Lock, AtSign, LockOpen, ChevronDown })),
    provideAnimationsAsync(),
    provideToastr({
      timeOut: 5000, // toasts duram 5 segundos
      extendedTimeOut: 2000, // 2 segundos extras se o usuário passar com o mouse
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      progressBar: true,
    }),
  ],
};
