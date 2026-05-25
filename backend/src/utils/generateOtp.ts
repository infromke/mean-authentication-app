import { Types } from 'mongoose'
import type { OtpType } from '../modules/otp/otp.types.js'

interface OtpOptions {
  userId: Types.ObjectId
  code: string
  type: OtpType
  expiresAt: Date
}

/**
 * Gera uma string de 6 dígitos numéricos aleatórios para ser usada como OTP.
 * @returns {string}
 */
const generateOtp = (): string => {
  let otp = ''

  for (let i = 0; i < 6; i++) {
    const digit = Math.floor(Math.random() * 10)
    otp += digit
  }

  return otp
}

/**
 * Gera o objeto de opções padrão para um novo documento OTP.
 * @param {string} userId - ID do usuário.
 * @param {'VERIFY' | 'RESET'} type - Tipo do OTP.
 * @returns {Object} Documento OTP estruturado.
 */
const createOtpOptions = (userId: string, type: OtpType): OtpOptions => ({
  userId: new Types.ObjectId(userId),
  code: generateOtp(),
  type: type,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
})

export { generateOtp, createOtpOptions }
