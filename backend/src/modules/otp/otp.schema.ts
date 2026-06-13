import z from 'zod'

/* REGRAS individuas de base */

const emailRule = z
  .email({ error: 'Provide a valid e-mail address' })
  .trim()
  .toLowerCase()
  .min(1, 'Email cannot be empty')

const otpRule = z.string({ error: 'OTP is required' }).min(1, 'OTP cannot be empty')

const OTP_TYPES = ['VERIFY', 'RESET'] as const

/* ESTRUTURAS ISOLADAS (para o z.infer) */

// POST /otps/email-verification/check/:id
export const verifyEmailBodySchema = z.object({ otp: otpRule })

// POST /otps/password-reset/request
export const requestResetBodySchema = z.object({ email: emailRule })

// POST /otps/password-reset/check
export const checkResetBodySchema = z.object({ otp: otpRule })

// PATCH /password-reset
export const resetPasswordBodySchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    error: 'Passwords must match each other',
    path: ['confirmPassword'], // erro associado ao campo confirmPassword
  })

// POST /otps/resend
export const resendOtpBodySchema = z.object({
  type: z.enum(OTP_TYPES, {
    error: 'Invalid OTP type',
  }),
})

/* SCHEMAS (para o Express consumir) */

const checkVerificationSchema = z.object({
  body: verifyEmailBodySchema,
})

// POST /otps/password-reset/request
const requestResetSchema = z.object({
  body: requestResetBodySchema,
})

// POST /otps/password-reset/check
const checkResetSchema = z.object({
  body: checkResetBodySchema,
})

// PATCH /password-reset
const resetPasswordSchema = z.object({
  body: resetPasswordBodySchema,
})

// POST /otps/resend
const resendOtpSchema = z.object({
  body: resendOtpBodySchema,
})

export {
  checkVerificationSchema,
  requestResetSchema,
  checkResetSchema,
  resetPasswordSchema,
  resendOtpSchema,
}
