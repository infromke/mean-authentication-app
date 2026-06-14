import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { CardBody } from '../../../shared/components/card-body/card-body';
import { InputGroup } from '../../../shared/components/input-group/input-group';

@Component({
  selector: 'app-reset-password',
  imports: [CardBody, InputGroup, ReactiveFormsModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPassword {
  private formBuilder = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  // definindo o formulário reativo
  form = this.formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]],
  });

  onResetSubmit(): void {
    const email = this.userService.resetEmail();

    if (!email) {
      this.toastr.info('Session expired. Request a new code!');
      this.router.navigate(['/forgot-password']);
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched(); // faz aparecer as mensagens de erro nos inputs
      return;
    }

    const formData = this.form.getRawValue();

    if (formData.confirmPassword !== formData.password) {
      this.toastr.error('Passwords must match each other');
      return;
    }

    this.authService.resetPassword(email, formData).subscribe({
      next: () => {
        this.userService.setResetEmail(null);
        this.toastr.success('Password changed successfully');
        this.router.navigate(['/']); // leva para a página de login
      },
      error: (err) => {
        this.toastr.error(err.error?.detail);
      },
    });
  }
}
