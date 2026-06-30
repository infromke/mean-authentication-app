import z from 'zod'

import type { Types } from 'mongoose'

import type { resendOtpBodySchema } from '../auth/auth.schema.js'

// estrutura do objeto Otp
export interface OtpOptions {
  userId: Types.ObjectId
  code: string
  type: OtpType
  expiresAt: Date
}

// literais permitidos para operações de OTP
export type OtpType = z.infer<typeof resendOtpBodySchema>['type']
