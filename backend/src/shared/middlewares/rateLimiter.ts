import createLimiter from '../utils/createLimiter.js'

/**
 * Proteção básica para o servidor inteiro.
 */
const globalLimiter = createLimiter(
  15,
  200,
  'Too many requests from this IP. Please try again in 15 minutes',
)

/**
 * Limitação para criação de usuários na rota POST `/users`.
 */
const authLimiter = createLimiter(60, 5, 'Too many accounts created. Please try again in 1 hour')

/**
 * Limitação para tentativas de login na rota POST `/auth/login`.
 */
const sessionLimiter = createLimiter(
  15,
  5,
  'Too many login attempts. Please try again in 15 minutes',
)

/**
 * Limitação para reenvio de OTP na rota POST `/auth/resend`.
 */
const otpSendLimiter = createLimiter(15, 3, 'Too many e-mails sent. Please try again in 15 minutes')

/**
 * Limitação para verificação de OTP na rota POST `/auth/verify`.
 */
const otpVerifyLimiter = createLimiter(
  15,
  10,
  'Too many failed attempts. Please try again in 15 minutes',
)

export { authLimiter, globalLimiter, otpSendLimiter, otpVerifyLimiter, sessionLimiter }
