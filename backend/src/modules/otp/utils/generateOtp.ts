import { Types } from 'mongoose'

import type { OtpType } from '../otp.types.js'

interface OtpOptions {
  userId: Types.ObjectId
  code: string
  type: OtpType
  expiresAt: Date
}

/**
 * Gera de forma pseudo-aleatória uma sequência numérica de 6 dígitos.
 * * @returns O código OTP como string.
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
 * Cria a estrutura inicial com os parâmetros padrão necessários para persistir um novo OTP. Define
 * de forma fixa o TTL (tempo de vida) de 15 minutos e converte a string do ID para o tipo
 * nativo do MongoDB.
 * @param userId A string do ID do usuário associado.
 * @param type O propósito do fluxo (verificação ou redefinição).
 * @returns O objeto tipado mapeando os campos do documento OTP.
 */
const createOtpOptions = (userId: string, type: OtpType): OtpOptions => ({
  userId: new Types.ObjectId(userId),
  code: generateOtp(),
  type: type,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
})

export { createOtpOptions, generateOtp }
