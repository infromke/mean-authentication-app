import { Routes } from '@angular/router';

import authGuard from './core/guards/auth-guard/auth-guard';
import passwordResetGuard from './core/guards/password-reset-guard/password-reset-guard';
import publicGuard from './core/guards/public-guard/public-guard';

export const routes: Routes = [
  {
    path: '', // raiz "/"
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
    title: 'Log in | Authentication System',
    canActivate: [publicGuard], // usuários logados não podem acessar essa página
  },
  {
    path: 'register', // cadastro
    loadComponent: () => import('./features/auth/sign-up/sign-up').then((m) => m.SignUp),
    title: 'Register | Authentication System',
    canActivate: [publicGuard], // usuários logados não podem acessar essa página
  },
  {
    path: 'forgot-password', // esqueceu a senha
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
    canActivate: [publicGuard], // usuários logados não podem acessar essa página
  },
  {
    path: 'forgot-password/verify', // página de verificação de otp para redefinição de senha
    loadComponent: () =>
      import('./features/auth/verify-reset/verify-reset').then((m) => m.VerifyReset),
    title: 'Authentication System',
    canActivate: [publicGuard], // usuários logados não podem acessar essa página
  },
  {
    path: 'forgot-password/reset', // página de redefinição de senha
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
    title: 'Authentication System',
    canActivate: [passwordResetGuard], // usuários sem state/cookie não podem acessar essa página
  },
  {
    path: 'home', // página inicial pós login
    loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
    title: 'Home | Authentication System',
    canActivate: [authGuard], // usuários deslogados não podem acessar essa página
  },
  {
    path: 'verify-email', // página de verificação de e-mail
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail),
    title: 'Authentication System',
    canActivate: [authGuard], // apenas usuários deslogados não podem acessar essa página (por enquanto)
  },
  {
    path: '**', // rota de erro
    loadComponent: () => import('./features/error/error-page/error-page').then((m) => m.ErrorPage),
    title: 'Oops!',
  },
];
