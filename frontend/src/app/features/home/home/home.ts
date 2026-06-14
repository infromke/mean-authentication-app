import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { UserSection } from '../../../shared/components/user-section/user-section';

@Component({
  selector: 'app-home',
  imports: [Navbar, UserSection, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  userService = inject(UserService);
  authService = inject(AuthService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  handleClickDelete() {
    const user = this.userService.userData();

    if (!user) return;

    if (
      confirm(
        'Are you sure you want to delete your account? This action is permanent and cannot be undone.',
      )
    ) {
      this.authService.delete(user.id).subscribe({
        next: () => {
          this.userService.clearUser();
          this.router.navigate(['/']);
          this.toastr.success('Account deleted successfully');
        },
        error: (err) => {
          this.toastr.error(err.error?.detail);
        },
      });
    }
  }
}
