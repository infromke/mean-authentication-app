import createLimiter from '../utils/createLimiter.js'

// proteção básica para o servidor inteiro
const globalLimiter = createLimiter(
  15,
  200,
  'Too many requests from this IP. Please try again in 15 minutes',
)

// limitação para criação de usuários (POST users/users)
const authLimiter = createLimiter(60, 5, 'Too many accounts created. Please try again in 1 hour')

// limitação para tentativas de login (POST sessions/login)
const sessionLimiter = createLimiter(
  15,
  5,
  'Too many login attempts. Please try again in 15 minutes',
)

// limitação para reenvio de OTP (POST /otps/resend)
const otpSendLimiter = createLimiter(15, 3, 'Too many e-mails sent. Please try again in 15 minutes')

// limitação para verificação de OTP (POST /otps/verify)
const otpVerifyLimiter = createLimiter(
  15,
  10,
  'Too many failed attempts. Please try again in 15 minutes',
)

export { globalLimiter, authLimiter, sessionLimiter, otpSendLimiter, otpVerifyLimiter }
