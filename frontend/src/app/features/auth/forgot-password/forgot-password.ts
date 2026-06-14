import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { CardBody } from '../../../shared/components/card-body/card-body';
import { InputGroup } from '../../../shared/components/input-group/input-group';

@Component({
  selector: 'app-forgot-password',
  imports: [CardBody, InputGroup, ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  private formBuilder = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onForgotSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.getRawValue().email;

    this.authService.requestPasswordReset(email).subscribe({
      next: (res) => {
        this.userService.setResetEmail(email); // guarda o email no state definido no UserService
        this.router.navigate(['/forgot-password/verify']); // navega para a próxima rota
        this.toastr.info(res.message);
      },
      error: (err) => {
        this.toastr.error(err.error?.detail);
      },
    });
  }
}
