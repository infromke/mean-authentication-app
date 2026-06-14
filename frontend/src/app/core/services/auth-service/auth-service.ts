import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { UserData } from '../user-service/user-service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  /* resource: /users */
  register(payload: any): Observable<UserData> {
    return this.http.post<UserData>(`${this.API_URL}/users`, payload, {
      withCredentials: true,
    });
  }

  delete(userId: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/users/${userId}`, {
      withCredentials: true,
    });
  }

  /* resource: /sessions */
  verifySession(): Observable<UserData> {
    return this.http.get<UserData>(`${this.API_URL}/sessions/me`, {
      withCredentials: true,
    });
  }

  login(credentials: any): Observable<UserData> {
    return this.http.post<UserData>(`${this.API_URL}/sessions/login`, credentials, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/sessions/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  /* resource: /otps */
  checkResetStatus(): Observable<{ active: boolean; message: string }> {
    return this.http.get<{ active: boolean; message: string }>(
      `${this.API_URL}/otps/password-reset/status`,
      { withCredentials: true },
    );
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/otps/password-reset/request`, {
      email,
    });
  }

  requestEmailVerification(userId: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/otps/email-verification/${userId}`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  checkEmailOtp(userId: string, otp: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/otps/email-verification/check/${userId}`,
      { otp },
      {
        withCredentials: true,
      },
    );
  }

  checkResetOtp(email: string, otp: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/otps/password-reset/check/`,
      { email, otp },
      {
        withCredentials: true,
      },
    );
  }

  resetPassword(
    email: string,
    data: { password: string; confirmPassword: string },
  ): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/otps/password-reset/`,
      {
        email,
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      },
      { withCredentials: true },
    );
  }

  resendOtp(type: 'VERIFY' | 'RESET', email?: string): Observable<{ message: string }> {
    const payload: any = { type };

    // para RESET, o e-mail é adicionado ao corpo da requisição
    if (type === 'RESET' && email) {
      payload.email = email;
    }

    return this.http.post<{ message: string }>(`${this.API_URL}/otps/resend`, payload, {
      withCredentials: type === 'VERIFY',
    });
  }
}
