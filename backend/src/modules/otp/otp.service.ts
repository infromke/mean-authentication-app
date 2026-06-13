import type { FilterQuery, ProjectionType } from 'mongoose'
import type { OtpType } from './otp.types.js'
import type { IUser, IUserDocument, IUserPersistence } from '../user/user.model.js'
import env from '../../config/env.js'
import userService from '../user/user.service.js'
import otpRepository from './otp.repository.js'
import AppError from '../../shared/errors/AppError.js'
import generateToken from '../../shared/utils/generateToken.js'
import { createOtpOptions } from './utils/generateOtp.js'
import { getOtpMailOptions } from './utils/generateMail.js'
import { sendEmail } from '../../config/nodemailer.js'
import cache from '../../shared/lib/cache.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'

class OtpService {
  #otpRepository: typeof otpRepository
  #userService: typeof userService

  constructor(
    otpRepositoryInstance: typeof otpRepository,
    userServiceInstance: typeof userService,
  ) {
    this.#otpRepository = otpRepositoryInstance
    this.#userService = userServiceInstance
  }

  // utilitário para busca avançada de usuário
  #getUserByFilter = async (
    filter: FilterQuery<IUser>,
    projection: ProjectionType<IUserDocument> | {} = {},
  ): Promise<any> => {
    return await this.#userService.findByFilter(filter, projection)
  }

  // utilitário para envio de e-mail
  #sendCodeEmail = async (userId: string, userEmail: string, otpType: OtpType): Promise<void> => {
    const otpOptions = createOtpOptions(userId, otpType)
    const newOtp = await this.#otpRepository.create(otpOptions)
    await sendEmail(getOtpMailOptions(userEmail, newOtp.code, otpType))
  }

  // utilitário para validação de otp
  #validateCode = async (userId: string, otpCode: string, otpType: OtpType): Promise<void> => {
    const otpDocument = await this.#otpRepository.findById(userId, otpType)

    if (!otpDocument) throw new AppError(404, 'Code has expired')
    if (otpCode !== otpDocument?.code) throw new AppError(403, 'Invalid code')

    await this.#otpRepository.deleteOne(userId, otpType)
  }

  getPasswordResetStatus = (token: string): any => {
    const identifier = token.split('.')[1]
    const cacheKey = `password_reset_${identifier}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as any | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const resetStatus = { active: true, message: 'The password reset session is active' }

    cache.set(cacheKey, resetStatus) // salva os dados no cache
    return resetStatus
  }

  resendOtpCode = async (type: OtpType, filter: FilterQuery<IUserDocument>): Promise<void> => {
    const user = await this.#getUserByFilter(filter)

    // verifica se o cooldown de 60s está ativo
    const cooldownKey = `otp_cooldown_${type}_${user.id}`
    if (cache.has(cooldownKey)) throw new AppError(429, 'Wait 60s before requesting a new code')

    // deleta o OTP previamente gerado
    await this.#otpRepository.deleteOne(user.id, type)

    if (type === 'VERIFY') await this.sendEmailVerificationCode(user.id)
    else await this.sendPasswordResetCode({ email: user.email })

    cache.set(cooldownKey, true, 60) // ativa o cooldown no cache
  }

  sendEmailVerificationCode = async (id: string): Promise<void> => {
    const user = await this.#userService.findById(id)
    if (user.isAccountVerified) throw new AppError(403, 'Account has already been verified')

    try {
      await this.#sendCodeEmail(user.id, user.email, 'VERIFY')
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        throw new AppError(409, 'An active e-mail code has already been sent to this account')
      }

      throw error // repassa outros erros inesperados
    }
  }

  confirmEmailVerification = async (id: string, otpCode: string): Promise<void> => {
    const user = await this.#userService.findById(id)
    if (user.isAccountVerified) throw new AppError(403, 'Account has already been verified')

    await this.#validateCode(user.id, otpCode, 'VERIFY')
    await this.#userService.updateUser(user.id, { isAccountVerified: true })

    clearUserCache(user.id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }

  sendPasswordResetCode = async (filter: FilterQuery<IUserDocument>): Promise<void> => {
    try {
      const user = await this.#getUserByFilter(filter)
      await this.#sendCodeEmail(user.id, user.email, 'RESET')
    } catch (error: unknown) {
      const isObjectError = error && typeof error === 'object'

      if (isObjectError && 'status' in error && error.status === 400) {
        return // não avisa que o usuário não foi encontrado
      }

      if (isObjectError && 'code' in error && error.code === 11000) {
        throw new AppError(
          409,
          'An active password reset code has already been sent to this account',
        )
      }

      throw error // repassa outros erros inesperados
    }
  }

  confirmPasswordResetCode = async (
    otpCode: string,
    filter: FilterQuery<IUserDocument>,
  ): Promise<string> => {
    const user = await this.#getUserByFilter(filter)
    await this.#validateCode(user.id, otpCode, 'RESET')

    const secret = env.JWT_RESET_SECRET
    if (!secret) throw new AppError(500, 'JWT_RESET_SECRET is not defined in environment variables')

    return generateToken({ id: user.id }, secret, '15m')
  }

  resetUserPassword = async (
    filter: FilterQuery<IUserDocument>,
    password: string,
  ): Promise<IUserPersistence> => {
    const user = await this.#getUserByFilter(filter, '+password') // recebe um objeto user não formatado
    const updatedUser = await this.#userService.updateUser(user._id, { password })

    const userIdString = user._id.toString()
    clearUserCache(userIdString) // limpa o cache para não retornar dados ultrapassados no próximo GET

    return updatedUser
  }
}

export default new OtpService(otpRepository, userService)
