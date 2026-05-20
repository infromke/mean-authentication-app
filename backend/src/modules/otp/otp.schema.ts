import z from 'zod'
import handleValidation from '../../middlewares/handleValidation.js'
import { idSchema } from '../../utils/common.schema.js'

// REGRAS individuas de base
const emailRule = z
  .email({ error: 'Provide a valid e-mail address' })
  .trim()
  .toLowerCase()
  .min(1, 'Email cannot be empty')

const otpRule = z.string({ error: 'OTP is required' }).min(1, 'OTP cannot be empty')

// SCHEMAS

// POST /otps/email-verification/check/:id
const checkVerificationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({ otp: otpRule }),
})

// POST /otps/password-reset/request
const requestResetSchema = z.object({
  body: z.object({ email: emailRule }),
})

// POST /otps/password-reset/check
const checkResetSchema = z.object({
  body: z.object({
    email: emailRule,
    otp: otpRule,
  }),
})

// PATCH /password-reset
const resetPasswordSchema = z.object({
  body: z
    .object({
      email: emailRule,
      newPassword: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string().min(1, 'Confirm your password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      error: 'Passwords must match each other',
      path: ['confirmPassword'], // erro associado ao campo confirmPassword
    }),
})

// POST /otps/resend
const resendOtpSchema = z.object({
  body: z
    .object({
      type: z
        .string({ error: 'Type is required' })
        .min(1, 'Type is required.')
        .refine((val) => ['VERIFY', 'RESET'].includes(val), {
          error: 'Invalid OTP type',
        }),
      email: emailRule.optional(),
    })
    .refine(
      (data) => {
        if (data.type === 'RESET') {
          const emailResult = z.email().safeParse(data.email)
          return emailResult.success
        }
        return true
      },
      {
        error: 'Provide a valid e-mail address for password reset',
        path: ['email'],
      },
    ),
})

export {
  checkVerificationSchema,
  requestResetSchema,
  checkResetSchema,
  resetPasswordSchema,
  resendOtpSchema,
}
