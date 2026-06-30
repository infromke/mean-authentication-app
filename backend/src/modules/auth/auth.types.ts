import z from 'zod'

import type {
  checkResetBodySchema,
  requestResetBodySchema,
  resendOtpBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './auth.schema.js'

// DTOs baseados nos schemas do Zod
export type VerifyEmailDTO = z.infer<typeof verifyEmailBodySchema>
export type VerifyResetDTO = z.infer<typeof checkResetBodySchema>

export type RequestResetDTO = z.infer<typeof requestResetBodySchema>

type RawResetPasswordDTO = z.infer<typeof resetPasswordBodySchema> // contém a propriedade "confirmPassword"
export type ResetPasswordDTO = Omit<RawResetPasswordDTO, 'confirmPassword'>

export type ResendCodeDTO = z.infer<typeof resendOtpBodySchema>
