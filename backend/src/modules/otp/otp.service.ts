import type { FilterQuery, ProjectionType } from 'mongoose'
import type { IUserDocument, IUserPersistence } from '../user/user.types.js'
import type { OtpType } from './otp.types.js'
import userService from '../user/user.service.js'
import otpRepository from './otp.repository.js'
import throwHttpError from '../../utils/throwHttpError.js'
import formatUserObject from '../../utils/formatUserObject.js'
import generateToken from '../../utils/generateToken.js'
import { createOtpOptions } from '../../utils/generateOtp.js'
import { getOtpMailOptions } from '../../utils/generateMail.js'
import { sendEmail } from '../../config/nodemailer.js'
import cache from '../../lib/cache.js'
import clearUserCache from '../../utils/clearUserCache.js'

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
    filter: FilterQuery<IUserDocument>,
    projection: ProjectionType<IUserDocument> | {} = {},
  ): Promise<any> => {
    return await this.#userService.find(filter, projection)
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

    if (!otpDocument) throwHttpError(404, 'Code has expired')
    if (otpCode !== otpDocument?.code) throwHttpError(403, 'Invalid code')

    await this.#otpRepository.remove(userId, otpType)
  }

  showStatus = async (token: string): Promise<any> => {
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

  sendVerification = async (id: string): Promise<void> => {
    const user = await this.#userService.show(id)
    if (user.isAccountVerified) throwHttpError(403, 'Account has already been verified')

    try {
      await this.#sendCodeEmail(user.id, user.email, 'VERIFY')
    } catch (error: any) {
      if (error.code === 11000)
        throwHttpError(409, 'An active e-mail code has already been sent to this account')
      throw error // repassa outros erros inesperados
    }
  }

  sendReset = async (filter: FilterQuery<IUserDocument>): Promise<void> => {
    try {
      const user = await this.#getUserByFilter(filter)
      await this.#sendCodeEmail(user.id, user.email, 'RESET')
    } catch (error: any) {
      if (error.status === 400) return // não avisa que o usuário não foi encontrado

      if (error.code === 11000)
        throwHttpError(409, 'An active password reset code has already been sent to this account')
      throw error // repassa outros erros inesperados
    }
  }

  resend = async (type: OtpType, filter: FilterQuery<IUserDocument>): Promise<void> => {
    const user = await this.#getUserByFilter(filter)

    // verifica se o cooldown de 60s está ativo
    const cooldownKey = `otp_cooldown_${type}_${user.id}`
    if (cache.has(cooldownKey)) throwHttpError(429, 'Wait 60s before requesting a new code')

    // deleta o OTP previamente gerado
    await this.#otpRepository.remove(user.id, type)

    if (type === 'VERIFY') await this.sendVerification(user.id)
    else await this.sendReset({ email: user.email })

    cache.set(cooldownKey, true, 60) // ativa o cooldown no cache
  }

  validateEmail = async (id: string, otpCode: string): Promise<void> => {
    const user = await this.#userService.show(id)
    if (user.isAccountVerified) throwHttpError(403, 'Account has already been verified')

    await this.#validateCode(user.id, otpCode, 'VERIFY')
    await this.#userService.update(user.id, { isAccountVerified: true })

    clearUserCache(user.id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }

  validateReset = async (otpCode: string, filter: FilterQuery<IUserDocument>): Promise<string> => {
    const user = await this.#getUserByFilter(filter)
    await this.#validateCode(user.id, otpCode, 'RESET')

    const userIdString = user._id.toString()

    const secret = process.env.JWT_RESET_SECRET
    if (!secret) throwHttpError(500, 'JWT_RESET_SECRET is not defined in environment variables')

    return generateToken({ id: userIdString }, secret, '15m')
  }

  resetPassword = async (
    filter: FilterQuery<IUserDocument>,
    password: string,
  ): Promise<IUserPersistence> => {
    const user = await this.#getUserByFilter(filter, '+password') // recebe um objeto user não formatado
    const updatedUser = await this.#userService.update(user._id, { password })

    clearUserCache(user._id) // limpa o cache para não retornar dados ultrapassados no próximo GET
    return updatedUser
  }
}

export default new OtpService(otpRepository, userService)
