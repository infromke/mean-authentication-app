import { Document, Types } from 'mongoose'

// os tipos literais permitidos para operações de OTP
export type OtpType = 'VERIFY' | 'RESET'

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
