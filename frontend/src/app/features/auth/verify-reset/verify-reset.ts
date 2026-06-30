import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { CardBody } from '../../../shared/components/card-body/card-body';
import { OtpInput } from '../../../shared/components/otp-input/otp-input';
import { ResendAction } from '../../../shared/components/resend-action/resend-action';

import { AuthService } from '../../../core/services/auth-service/auth-service';

@Component({
  selector: 'app-verify-reset',
  imports: [CardBody, OtpInput, ResendAction],
  templateUrl: './verify-reset.html',
  styleUrl: './verify-reset.scss',
})
export class VerifyReset {
  private authService = inject(AuthService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  @ViewChild(ResendAction) resendAction!: ResendAction;
  @ViewChild(OtpInput) otpInput!: OtpInput;

  isLoading = signal(false);

  // recebe o código
  handleOtpSubmit(otp: string) {
    this.isLoading.set(true);
    this.authService.checkResetOtp(otp).subscribe({
      next: () => {
        // leva o usuário para a página de redefinição de senha
        this.router.navigate(['/forgot-password/reset']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.otpInput.reset(); // limpa os campos se o código estiver errado

        if (err.status === 422 && err.error?.code === 'INVALID_CODE') {
          this.toastr.error(err.error?.detail);
          return;
        }

        if (err.status === 401) {
          this.router.navigate(['/']);
          this.toastr.info('Your session has timed out. Please try again.');
          return;
        }

        this.toastr.error(err.error?.detail);
      },
    });
  }

  // reenvia o código
  handleResend() {
    this.resendAction.setResending(true);
    this.authService.resendOtp('RESET').subscribe({
      next: (res) => {
        this.toastr.success(res.message);
        this.resendAction.startTimer();
      },
      error: (err) => {
        if (err.status === 401) {
          this.router.navigate(['/']);
          this.toastr.info('Your session has timed out. Please try again.');
          return;
        }
        this.resendAction.startTimer();
        this.toastr.error(err.error?.detail);
      },
      complete: () => this.resendAction.setResending(false),
    });
  }
}
