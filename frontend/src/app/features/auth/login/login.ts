import { Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth-service/auth-service';
import { UserService } from '../../../core/services/user-service/user-service';
import { CardBody } from '../../../shared/components/card-body/card-body';
import { InputGroup } from '../../../shared/components/input-group/input-group';
import { RedirectAction } from '../../../shared/components/redirect-action/redirect-action';

@Component({
  selector: 'app-login',
  imports: [CardBody, InputGroup, RedirectAction, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private formBuilder = inject(NonNullableFormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onLoginSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // faz aparecer as mensagens de erro nos inputs
      return;
    }

    const formData = this.form.getRawValue();

    this.authService.login(formData).subscribe({
      next: (user) => {
        this.userService.setUserData(user);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.toastr.error(err.error?.detail);
      },
    });
  }
}
