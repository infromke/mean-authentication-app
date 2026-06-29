import { Types } from 'mongoose'

import AppError from '../../shared/errors/AppError.js'

import type { IOtpPersistence } from './otp.model.js'
import otpRepository from './otp.repository.js'
import type { OtpOptions, OtpType } from './otp.types.js'

export class OtpService {
  #otpRepository: typeof otpRepository

  constructor(otpRepositoryInstance: typeof otpRepository) {
    this.#otpRepository = otpRepositoryInstance
  }

  /**
   * Gera de forma pseudo-aleatória uma sequência numérica de 6 dígitos.
   */
  #generateCode = (): string => {
    let code = ''

    for (let i = 0; i < 6; i++) {
      const digit = Math.floor(Math.random() * 10)
      code += digit
    }

    return code
  }

  /**
   * Cria a estrutura inicial com os parâmetros padrão necessários para persistir um novo OTP. Define
   * de forma fixa o TTL (tempo de vida) de 15 minutos e converte a string do ID para o tipo
   * nativo do MongoDB.
   */
  #generateOtp = (userId: string, otpType: OtpType): OtpOptions => ({
    userId: new Types.ObjectId(userId),
    code: this.#generateCode(),
    type: otpType,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
  })

  createOtp = async (userId: string, otpType: OtpType): Promise<IOtpPersistence> => {
    const otpData = this.#generateOtp(userId, otpType)
    return await this.#otpRepository.create(otpData)
  }

  validateOtp = async (userId: string, userCode: string, otpType: OtpType): Promise<void> => {
    const otpDocument = await this.#otpRepository.findById(userId, otpType)

    if (!otpDocument) throw new AppError(404, 'Code not found or expired')
    if (userCode !== otpDocument?.code) throw new AppError(422, 'Invalid code')

    await this.deleteOtp(userId, otpType)
  }

  deleteOtp = async (userId: string, otpType: OtpType): Promise<void> => {
    const result = await this.#otpRepository.deleteOne(userId, otpType)

    if (result.deletedCount === 0)
      console.warn(
        `[MONGODB] Attempt to delete OTP (${otpType}) document for user '${userId}' failed`,
      )
  }
}

export default new OtpService(otpRepository)
