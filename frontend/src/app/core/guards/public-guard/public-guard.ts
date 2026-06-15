import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from '../../services/auth-service/auth-service';
import { UserService } from '../../services/user-service/user-service';

const publicGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // verifica se o usuário está logado e o redireciona para /home
  if (userService.userData()) {
    router.navigate(['/home']);
    return false;
  }

  // se userData estiver null (por conta de F5 ou navegação direta pela URL),
  // verifica o estado da sessão com o verifySession()
  return authService.verifySession().pipe(
    map((user) => {
      if (user) {
        userService.setUserData(user);
        router.navigate(['/home']);

        return false; // redireciona para /home
      }

      return true; // deixa o usuário acessar a rota (ex.: "/", "/register" ou "/forgot-password")
    }),
    catchError(() => {
      userService.clearUser();
      return of(true); // vai para o login caso haja algum erro
    }),
  );
};

export default publicGuard;
