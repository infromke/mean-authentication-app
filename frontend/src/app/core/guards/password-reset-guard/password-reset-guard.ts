import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../../services/auth-service/auth-service';
import { UserService } from '../../services/user-service/user-service';

import { catchError, map, of } from 'rxjs';

const passwordResetGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authService = inject(AuthService);

  const router = inject(Router);

  const resetEmail = userService.resetEmail();

  // leva o usuário para a primeira etapa do fluxo caso não haja e-mail no state
  if (!resetEmail) {
    router.navigate(['/forgot-password']);
    return false;
  }

  // verifica se o cookie passwordToken é válido
  return authService.checkResetStatus().pipe(
    map((res) => {
      if (res.active) {
        return true; // token válido
      }
      router.navigate(['/forgot-password']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/forgot-password']);
      return of(false); // sessão inválida
    }),
  );
};

export default passwordResetGuard;
