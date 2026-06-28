import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { CardBody } from '../../../shared/components/card-body/card-body';
import { InputGroup } from '../../../shared/components/input-group/input-group';
import { RedirectAction } from '../../../shared/components/redirect-action/redirect-action';
import passwordsMatchValidator from '../../../shared/validators/passwordsMatchValidator';

@Component({
  selector: 'app-sign-up',
  imports: [CardBody, InputGroup, RedirectAction, ReactiveFormsModule],
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.scss',
})
export class SignUp {
  private formBuilder = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  // definindo o formulário reativo
  form = this.formBuilder.group(
    {
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: passwordsMatchValidator,
    },
  );

  onRegisterSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // faz aparecer as mensagens de erro nos inputs
      return;
    }

    const formData = this.form.getRawValue();

    this.authService.register(formData).subscribe({
      next: (user) => {
        this.userService.setUserData(user);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        if (err.status === 409 && err.error?.code === 'EMAIL_ALREADY_IN_USE') {
          const emailControl = this.form.get('email');

          if (emailControl) {
            emailControl.setErrors({ emailInUse: true });
          }
        } else {
          this.toastr.error(err.error?.detail);
        }
      },
    });
  }
}
