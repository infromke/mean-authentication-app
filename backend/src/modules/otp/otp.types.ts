import z from 'zod'
import type {
  checkResetBodySchema,
  requestResetBodySchema,
  resendOtpBodySchema,
  resetPasswordBodySchema,
  verifyEmailBodySchema,
} from './otp.schema.js'
import { Document, Types } from 'mongoose'

// DTOs baseados nos schemas do Zod
export type OtpType = z.infer<typeof resendOtpBodySchema>['type'] // literais permitidos para operações de OTP

export type VerifyEmailDTO = z.infer<typeof verifyEmailBodySchema>
export type VerifyResetDTO = z.infer<typeof checkResetBodySchema>

export type RequestResetDTO = z.infer<typeof requestResetBodySchema>

type RawResetPasswordDTO = z.infer<typeof resetPasswordBodySchema> // contém a propriedade "confirmPassword"
export type ResetPasswordDTO = Omit<RawResetPasswordDTO, 'confirmPassword'>

export type ResendCodeDTO = z.infer<typeof resendOtpBodySchema>

// esqueleto da entidade
export interface IOtp {
  userId: Types.ObjectId
  code: string
  type: OtpType
  expiresAt: Date
  createdAt?: Date
  updatedAt?: Date
}

// representa o objeto exatamente como ele existe no banco
export interface IOtpPersistence extends IOtp {
  _id: Types.ObjectId // garante que o service saiba da existência do _id
}

// une os dados do OTP com todas as funções internas do mongoose, como .save(), .populate(), .isModified()
export interface IOtpDocument extends IOtp, Document {
  _id: Types.ObjectId
}
