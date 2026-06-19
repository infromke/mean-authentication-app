import env from '../../config/env.js'

import AppError from '../../shared/errors/AppError.js'
import cache from '../../shared/lib/cache.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'
import generateToken from '../../shared/utils/generateToken.js'
import { validatePassword } from '../../shared/utils/hash.js'

import userService from '../user/user.service.js'
import formatUserObject from '../user/utils/formatUserObject.js'

// interface para os dados de login do usuário
interface UserCredentials {
  email: string
  password: string
}

class AuthService {
  #userService: typeof userService

  constructor(userServiceInstance: typeof userService) {
    this.#userService = userServiceInstance
  }

  /**
   * Busca os detalhes da sessão ativa do usuário com TTL curto de cache (2 minutos).
   */
  getAuthenticatedUser = async (id: string): Promise<any> => {
    const cacheKey = `user_session_${id}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as any | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const user = await this.#userService.getSummaryById(id)
    cache.set(cacheKey, user, 120)
    return user
  }

  /**
   * Executa a autenticação e mitiga ataques de temporização (Timing Attacks) gerando
   * um delay artificial com uma hash fixa quando o usuário não existe no banco.
   */
  authenticate = async (
    credentials: UserCredentials,
  ): Promise<{ user: any; accessToken: string }> => {
    const user = await this.#userService.findByEmail(credentials.email, '+password') // pode retornar null

    // usa a senha do usuário mesmo ou uma falsa (para gastar o mesmo tempo computacional)
    const passwordToValidate =
      user?.password ?? '$2a$10$EBj1t.NspLYcG8p/Qts4Bue35p1NCIR29jNwtF0P29eVKxRV2s5cm'

    const isPasswordValid = await validatePassword(credentials.password, passwordToValidate)

    if (!user || !isPasswordValid) {
      throw new AppError(400, 'Invalid credentials')
    }

    const userIdString = user._id.toString()
    const accessToken = generateToken({ id: userIdString }, env.JWT_ACCESS_SECRET, '1d')

    clearUserCache(userIdString)
    return { user: formatUserObject(user), accessToken }
  }

  /**
   * Remove e invalida as entradas de cache ativas associadas ao ID do usuário.
   */
  disconnect = (id: string): void => {
    if (id) clearUserCache(id)
  }
}

export default new AuthService(userService)
