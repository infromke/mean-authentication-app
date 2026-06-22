import { z } from 'zod'

/* REGRAS individuas de base */

const emailRule = z
  .email({ error: 'Provide a valid e-mail address' })
  .trim()
  .toLowerCase()
  .min(1, 'Email cannot be empty')

const otpRule = z.string({ error: 'OTP is required' }).min(1, 'OTP cannot be empty')

const OTP_TYPES = ['VERIFY', 'RESET'] as const

/**
 * -----------------------------------------------------------------------------
 * AUTH
 * -----------------------------------------------------------------------------
 */

/* ESTRUTURAS ISOLADAS (para o z.infer) */

export const loginBodySchema = z.object({
  email: emailRule,
  password: z.string({ error: 'Password is required' }).min(1, 'Password cannot be empty'),
})

/* SCHEMAS (para o Express consumir) */

const loginSchema = z.object({
  body: loginBodySchema,
})

/**
 * -----------------------------------------------------------------------------
 * IDENTITY
 * -----------------------------------------------------------------------------
 */

/* ESTRUTURAS ISOLADAS (para o z.infer) */

// POST /auth/email-verification/check
export const verifyEmailBodySchema = z.object({ otp: otpRule })

// POST /auth/password-reset/request
export const requestResetBodySchema = z.object({ email: emailRule })

// POST /auth/password-reset/check
export const checkResetBodySchema = z.object({ otp: otpRule })

// PATCH /auth/password-reset
export const resetPasswordBodySchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords must match each other',
    path: ['confirmPassword'],
  })

// POST /auth/resend
export const resendOtpBodySchema = z.object({
  type: z
    .string({ error: 'OTP type is required' })
    .trim()
    .transform((val) => val.toUpperCase()) // padroniza para letras maiúsculas
    .pipe(z.enum(OTP_TYPES, { error: 'Invalid OTP type' })),
})

/* SCHEMAS (para o Express consumir) */

// POST /auth/email-verification/check
const checkVerificationSchema = z.object({
  body: verifyEmailBodySchema,
})

// POST /auth/password-reset/request
const requestResetSchema = z.object({
  body: requestResetBodySchema,
})

// POST /auth/password-reset/check
const checkResetSchema = z.object({
  body: checkResetBodySchema,
})

// PATCH /auth/password-reset
const resetPasswordSchema = z.object({
  body: resetPasswordBodySchema,
})

// POST /auth/resend
const resendOtpSchema = z.object({
  body: resendOtpBodySchema,
})

export {
  checkResetSchema,
  checkVerificationSchema,
  loginSchema,
  requestResetSchema,
  resendOtpSchema,
  resetPasswordSchema,
}
