import { Component, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { AuthService } from '../../../core/services/auth-service/auth-service';

import { CardBody } from '../../../shared/components/card-body/card-body';
import { OtpInput } from '../../../shared/components/otp-input/otp-input';
import { ResendAction } from '../../../shared/components/resend-action/resend-action';

@Component({
  selector: 'app-verify-email',
  imports: [CardBody, OtpInput, ResendAction],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.scss',
})
export class VerifyEmail {
  private authService = inject(AuthService);
  private router = inject(Router);

  private toastr = inject(ToastrService);

  @ViewChild(ResendAction) resendAction!: ResendAction;
  @ViewChild(OtpInput) otpInput!: OtpInput;

  isLoading = signal(false);
  private hasSentInitialOtp = false;

  // envia o otp na inicialização da página
  ngOnInit(): void {
    this.sendInitialOtp();
  }

  private sendInitialOtp() {
    if (this.hasSentInitialOtp) return;

    this.authService.requestEmailVerification().subscribe({
      next: (res) => {
        this.hasSentInitialOtp = true;
        this.toastr.success('Code has been sent');
      },
      error: (err) => this.toastr.error(err.error?.detail),
    });
  }

  // recebe o código
  handleOtpSubmit(otp: string) {
    this.isLoading.set(true);

    this.authService.checkEmailOtp(otp).subscribe({
      next: (res) => {
        // atualiza o estado do usuário para verificado (isAccountVerified: true)
        this.authService.verifySession().subscribe(() => {
          this.router.navigate(['/home']);
          this.toastr.success('E-mail verified successfully');
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toastr.error(err.error?.detail);
        this.otpInput.reset(); // limpa os campos se o código estiver errado
      },
    });
  }

  // reenvia o código
  handleResend() {
    this.resendAction.setResending(true);
    this.authService.resendOtp('VERIFY').subscribe({
      next: (res) => {
        this.toastr.info(res.message);
        this.resendAction.startTimer();
      },
      error: (err) => this.toastr.error(err.error?.detail),
      complete: () => this.resendAction.setResending(false),
    });
  }
}
