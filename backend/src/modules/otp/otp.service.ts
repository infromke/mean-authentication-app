import type { FilterQuery, ProjectionType } from 'mongoose'
import type { OtpType } from './otp.types.js'
import type { IUser, IUserDocument } from '../user/user.model.js'
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

  /**
   * Encapsula a busca de usuários.
   */
  #getUserByFilter = async (
    filter: FilterQuery<IUser>,
    projection: ProjectionType<IUserDocument> | {} = {},
  ): Promise<any> => {
    return await this.#userService.findByFilter(filter, projection)
  }

  /**
   * Cria o documento OTP no banco e despacha o e-mail contendo o código de forma assíncrona.
   */
  #sendCodeEmail = async (userId: string, userEmail: string, otpType: OtpType): Promise<void> => {
    const otpOptions = createOtpOptions(userId, otpType)
    const newOtp = await this.#otpRepository.create(otpOptions)
    await sendEmail(getOtpMailOptions(userEmail, newOtp.code, otpType))
  }

  /**
   * Valida a integridade do código fornecido e deleta seu registro logo em seguida.
   */
  #validateCode = async (userId: string, otpCode: string, otpType: OtpType): Promise<void> => {
    const otpDocument = await this.#otpRepository.findById(userId, otpType)

    if (!otpDocument) throw new AppError(404, 'Code has expired')
    if (otpCode !== otpDocument?.code) throw new AppError(403, 'Invalid code')

    await this.#otpRepository.deleteOne(userId, otpType)
  }

  /**
   * Retorna o status da sessão de redefinição de senha, lendo e salvando o estado em cache.
   */
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

  /**
   * Reenvia o código OTP controlando concorrência através de trava curta de cooldown (60 segundos).
   * Silencia falhas de enumeração caso o fluxo em andamento seja o de redefinição de senha.
   */
  resendOtpCode = async (type: OtpType, filter: FilterQuery<IUserDocument>): Promise<void> => {
    try {
      const user = await this.#getUserByFilter(filter)

      // verifica se o cooldown de 60s está ativo
      const cooldownKey = `otp_cooldown_${type}_${user.id}`
      if (cache.has(cooldownKey)) throw new AppError(429, 'Wait 60s before requesting a new code')

      // deleta o OTP previamente gerado
      await this.#otpRepository.deleteOne(user.id, type)

      if (type === 'VERIFY') await this.sendEmailVerificationCode(user.id)
      else await this.sendPasswordResetCode({ email: user.email })

      cache.set(cooldownKey, true, 60) // ativa o cooldown no cache
    } catch (error: unknown) {
      if (type === 'RESET' && error instanceof AppError && error.status === 404) {
        return // silencia o erro caso o usuário não for encontrado
      }
      throw error // repassa outros erros
    }
  }

  /**
   * Envia o código de verificação para o usuário, somente desconsiderando a operação
   * se o e-mail já estiver verificado.
   */
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

  /**
   * Confirma a verificação do e-mail, altera o estado do usuário no banco e limpa caches de sessão antigos.
   */
  confirmEmailVerification = async (id: string, otpCode: string): Promise<void> => {
    const user = await this.#userService.findById(id)
    if (user.isAccountVerified) throw new AppError(403, 'Account has already been verified')

    await this.#validateCode(user.id, otpCode, 'VERIFY')
    await this.#userService.updateUser(user.id, { isAccountVerified: true })

    clearUserCache(user.id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }

  /**
   * Envia o código de redefinição para o usuário e gera o token `resetEmailToken` (de 5 min).
   * Caso necessário, cria tokens fantasmas (shadow tokens) com um e-mail fictício para
   * camuflar o tempo de resposta da API.
   */
  sendPasswordResetCode = async (filter: FilterQuery<IUserDocument>): Promise<any> => {
    try {
      const user = await this.#getUserByFilter(filter)
      await this.#sendCodeEmail(user.id, user.email, 'RESET')

      return generateToken({ email: user.email }, env.JWT_RESET_SECRET, '5m')
    } catch (error: unknown) {
      const isObjectError = error && typeof error === 'object'

      if (isObjectError && 'status' in error && error.status === 404) {
        // gera um token falso pra gastar o mesmo tempo computacional
        return generateToken({ email: 'for_security@example.com' }, env.JWT_RESET_SECRET, '5m')
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

  /**
   * Valida o código OTP e gera o token `passwordToken` (de 15 min) que libera a troca de senha.
   */
  confirmPasswordResetCode = async (
    filter: FilterQuery<IUserDocument>,
    otpCode: string,
  ): Promise<string> => {
    const user = await this.#getUserByFilter(filter)
    await this.#validateCode(user.id, otpCode, 'RESET')
    return generateToken({ email: user.email }, env.JWT_RESET_SECRET, '15m')
  }

  /**
   * Persiste as novas credenciais do usuário e invalida imediatamente todos os caches vinculados ao ID.
   */
  resetUserPassword = async (
    filter: FilterQuery<IUserDocument>,
    password: string,
  ): Promise<void> => {
    const user = await this.#getUserByFilter(filter, '+password') // recebe um objeto user não formatado
    await this.#userService.updateUser(user._id, { password })
    const userIdString = user._id.toString()
    clearUserCache(userIdString) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }
}

export default new OtpService(otpRepository, userService)
