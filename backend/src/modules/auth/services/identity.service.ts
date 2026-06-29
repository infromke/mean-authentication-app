import type { ProjectionType } from 'mongoose'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import cache from '../../../shared/lib/cache.js'
import mailService from '../../../shared/mail/mail.service.js'
import clearUserCache from '../../../shared/utils/clearUserCache.js'
import generateToken from '../../../shared/utils/generateToken.js'
import otpService from '../../otp/otp.service.js'
import type { OtpType } from '../../otp/otp.types.js'
import type { IUserDocument, IUserPersistence } from '../../user/user.model.js'
import userService from '../../user/user.service.js'
import type { FormattedUser } from '../../user/utils/formatUserObject.js'

// interface dedicada para o método getPasswordResetStatus
interface PasswordResetStatus {
  active: boolean
  message: string
}

class IdentityService {
  #userService: typeof userService
  #otpService: typeof otpService
  #mailService: typeof mailService

  constructor(
    userServiceInstance: typeof userService,
    otpServiceInstance: typeof otpService,
    mailServiceInstance: typeof mailService,
  ) {
    this.#userService = userServiceInstance
    this.#otpService = otpServiceInstance
    this.#mailService = mailServiceInstance
  }

  /**
   * Encapsula a busca de usuários com projeção. Retorna a entidade bruta do usuário no banco de dados.
   */
  #getUserByEmail = async (
    email: string,
    projection: ProjectionType<IUserDocument> | {} = {},
  ): Promise<IUserPersistence> => {
    const user = await this.#userService.findByEmail(email, projection)

    if (!user) throw new AppError(404, ['User not found', `User with e-mail ${email} not found`])

    return user
  }

  /**
   * Centraliza a criação de códigos OTP e o envio de e-mails transacionais.
   * @param userId O ID de persistência do usuário no banco de dados.
   * @param userEmail O endereço de e-mail do destinatário.
   * @param otpType O propósito semântico do código ("VERIFY" ou "RESET").
   * @param emailType O template correspondente para o serviço de e-mail.
   */
  #createOtpAndSendEmail = async (
    userId: string,
    userEmail: string,
    otpType: OtpType,
    emailType: 'verification' | 'password reset',
  ): Promise<void> => {
    try {
      const otpDocument = await this.#otpService.createOtp(userId, otpType)
      await this.#mailService.sendOtpEmail(userEmail, otpDocument.code, emailType)
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        throw new AppError(409, 'A code has already been sent to this account')
      }
      throw error // lança outros erros inesperados
    }
  }

  /**
   * Checa a tipagem do objeto User e a reconhece em sua forma bruta (`IUserPersistence`)
   * ou higienizada (`FormattedUser`).
   */
  #isUserPersistenceEntity = (user: IUserPersistence | FormattedUser): user is IUserPersistence => {
    return '_id' in user
  }

  /**
   * Retorna o status da sessão de redefinição de senha, lendo e salvando o estado em cache.
   */
  getPasswordResetStatus = (token: string): PasswordResetStatus => {
    const identifier = token.split('.')[1]
    const cacheKey = `password_reset_${identifier}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as PasswordResetStatus | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const resetStatus = { active: true, message: 'The password reset session is active' }

    cache.set(cacheKey, resetStatus)
    return resetStatus
  }

  /**
   * Reenvia o código OTP controlando concorrência através de trava curta de cooldown (60 segundos).
   * Silencia falhas de enumeração caso o fluxo em andamento seja o de redefinição de senha.
   */
  resendOtpCode = async (type: OtpType, identifier: string): Promise<void> => {
    try {
      const user = identifier.includes('@')
        ? await this.#getUserByEmail(identifier)
        : await this.#userService.getSummaryById(identifier)

      const userId = this.#isUserPersistenceEntity(user) ? user._id.toString() : user.id

      // verifica se o cooldown de 60s está ativo
      const cooldownKey = `otp_cooldown_${type}_${userId}`
      if (cache.has(cooldownKey)) throw new AppError(429, 'Wait 60s before requesting a new code')

      // deleta o OTP previamente gerado
      await this.#otpService.deleteOtp(userId, type)

      if (type === 'VERIFY') await this.sendEmailVerificationCode(userId)
      else await this.sendPasswordResetCode(user.email)

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
    const user = await this.#userService.getSummaryById(id)

    if (user.isAccountVerified) throw new AppError(403, 'Account has already been verified')

    await this.#createOtpAndSendEmail(user.id, user.email, 'VERIFY', 'verification')
  }

  /**
   * Confirma a verificação do e-mail, altera o estado do usuário no banco e limpa caches de sessão antigos.
   */
  confirmEmailVerification = async (id: string, otpCode: string): Promise<void> => {
    const user = await this.#userService.getSummaryById(id)
    if (user.isAccountVerified) throw new AppError(403, 'Account has already been verified')
    await this.#otpService.validateOtp(user.id, otpCode, 'VERIFY')
    await this.#userService.updateUser(user.id, { isAccountVerified: true })

    clearUserCache(user.id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }

  /**
   * Envia o código de redefinição para o usuário e gera o token `resetEmailToken` (de 5 min).
   * - `200 OK`: Retorna o token de redefinição gerado;
   * - `404 Not Found`: Retorna um token fantasma (shadow token) para mitigar user enumeration;
   * - `409 Conflict`: Anexa um novo token de redefinição aos metadados do erro.
   */
  sendPasswordResetCode = async (email: string): Promise<string> => {
    let userEmailForToken = 'for_security@example.com' // fallback

    try {
      const user = await this.#getUserByEmail(email)
      userEmailForToken = user.email
      await this.#createOtpAndSendEmail(
        user._id.toString(),
        userEmailForToken,
        'RESET',
        'password reset',
      )
      return generateToken({ email: userEmailForToken }, env.JWT_RESET_SECRET, '5m')
    } catch (error: unknown) {
      const isAppError = error instanceof AppError

      // para camuflar o tempo de resposta da API quando o usuário não existe
      if (isAppError && error.status === 404) {
        return generateToken({ email: userEmailForToken }, env.JWT_RESET_SECRET, '5m')
      }

      // quando o usuário já possui um código ativo, apenas reatribuímos o token de e-mail
      if (isAppError && error.status === 409) {
        const recoveryToken = generateToken(
          { email: userEmailForToken },
          env.JWT_RESET_SECRET,
          '5m',
        )

        throw new AppError(409, error.message).withData(recoveryToken)
      }

      throw error // repassa outros erros inesperados
    }
  }

  /**
   * Valida o código OTP e gera o token `passwordToken` (de 15 min) que libera a troca de senha.
   */
  confirmPasswordResetCode = async (email: string, otpCode: string): Promise<string> => {
    try {
      const user = await this.#getUserByEmail(email)
      await this.#otpService.validateOtp(user._id.toString(), otpCode, 'RESET')
      return generateToken({ email: user.email }, env.JWT_RESET_SECRET, '15m')
    } catch (error) {
      if (error instanceof AppError && error.status === 404) {
        throw new AppError(403, 'Invalid code') // não avisa que o usuário não existe, apenas nega o código
      }

      throw error // repassa outros erros inesperados
    }
  }

  /**
   * Persiste as novas credenciais do usuário e invalida imediatamente todos os caches vinculados ao ID.
   */
  resetUserPassword = async (email: string, password: string): Promise<void> => {
    const user = await this.#getUserByEmail(email, '+password')
    await this.#userService.updateUser(user._id.toString(), { password })
  }
}

export default new IdentityService(userService, otpService, mailService)
