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

  /* resource: /auth */
  verifySession(): Observable<UserData> {
    return this.http.get<UserData>(`${this.API_URL}/auth/me`, {
      withCredentials: true,
    });
  }

  login(credentials: any): Observable<UserData> {
    return this.http.post<UserData>(`${this.API_URL}/auth/login`, credentials, {
      withCredentials: true,
    });
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  checkResetStatus(): Observable<{ active: boolean; message: string }> {
    return this.http.get<{ active: boolean; message: string }>(
      `${this.API_URL}/auth/password-reset/me`,
      { withCredentials: true },
    );
  }

  resendOtp(type: 'VERIFY' | 'RESET', email?: string): Observable<{ message: string }> {
    const payload: any = { type };

    // para RESET, o e-mail é adicionado ao corpo da requisição
    if (type === 'RESET' && email) {
      payload.email = email;
    }

    return this.http.post<{ message: string }>(`${this.API_URL}/auth/resend`, payload, {
      withCredentials: type === 'VERIFY',
    });
  }

  requestEmailVerification(): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/auth/email-verification`,
      {},
      {
        withCredentials: true,
      },
    );
  }

  checkEmailOtp(otp: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/auth/email-verification/check`,
      { otp },
      {
        withCredentials: true,
      },
    );
  }

  requestPasswordReset(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.API_URL}/auth/password-reset/request`,
      {
        email,
      },
      {
        withCredentials: true,
      },
    );
  }

  checkResetOtp(otp: string): Observable<void> {
    return this.http.post<void>(
      `${this.API_URL}/auth/password-reset/check/`,
      { otp },
      {
        withCredentials: true,
      },
    );
  }

  resetPassword(data: { password: string; confirmPassword: string }): Observable<any> {
    return this.http.patch(
      `${this.API_URL}/auth/password-reset/`,
      {
        newPassword: data.password,
        confirmPassword: data.confirmPassword,
      },
      { withCredentials: true },
    );
  }
}
