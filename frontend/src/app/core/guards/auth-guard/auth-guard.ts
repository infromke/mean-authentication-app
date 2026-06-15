import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth-service/auth-service';
import { UserService } from '../../services/user-service/user-service';

const authGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // verifica se o usuário está deslogado e o redireciona para a página de login
  if (!userService.userData()) {
    router.navigate(['/']);
    return false;
  }

  return authService.verifySession().pipe(
    map((user) => {
      if (user) {
        userService.setUserData(user);
        return true; // usuário está logado então pode acessar a /home
      }

      router.navigate(['/']); // redireciona para o login
      return false;
    }),
    catchError(() => {
      userService.clearUser();
      router.navigate(['/']);

      return of(false); // vai para o login caso haja algum erro
    }),
  );
};

export default authGuard;
