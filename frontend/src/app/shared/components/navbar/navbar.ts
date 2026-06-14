import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { Menu } from '../menu/menu';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, Menu],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  userService = inject(UserService);
  authService = inject(AuthService);
  private router = inject(Router);

  async handleClickLogOut() {
    this.authService.logout().subscribe({
      next: () => {},
      error: () => {}, // o usuário será deslogado não importa o resultado da chamada à API
      complete: () => {
        this.userService.clearUser();
        this.router.navigate(['/']);
      },
    });
  }
}
