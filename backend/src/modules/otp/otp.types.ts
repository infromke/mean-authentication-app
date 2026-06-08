import z from 'zod'
import type {
  checkResetBodySchema,
  requestResetBodySchema,
  resendOtpBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './otp.schema.js'

// DTOs baseados nos schemas do Zod
export type OtpType = z.infer<typeof resendOtpBodySchema>['type'] // literais permitidos para operações de OTP

export type VerifyEmailDTO = z.infer<typeof verifyEmailBodySchema>
export type VerifyResetDTO = z.infer<typeof checkResetBodySchema>

export type RequestResetDTO = z.infer<typeof requestResetBodySchema>

type RawResetPasswordDTO = z.infer<typeof resetPasswordBodySchema> // contém a propriedade "confirmPassword"
export type ResetPasswordDTO = Omit<RawResetPasswordDTO, 'confirmPassword'>

export type ResendCodeDTO = z.infer<typeof resendOtpBodySchema>
