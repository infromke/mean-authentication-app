import env from '../../config/env.js'
import userService from '../user/user.service.js'
import AppError from '../../shared/errors/AppError.js'
import generateToken from '../../shared/utils/generateToken.js'
import { validatePassword } from '../../shared/utils/hash.js'
import formatUserObject from '../user/utils/formatUserObject.js'
import cache from '../../shared/lib/cache.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'

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
    const user = await this.#userService.findById(id)
    cache.set(cacheKey, user, 120) // salva os dados no cache com TTL de 2 min
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
    const passwordToValidate = user
      ? user.password
      : '$2a$10$EBj1t.NspLYcG8p/Qts4Bue35p1NCIR29jNwtF0P29eVKxRV2s5cm'

    const isPasswordValid = await validatePassword(credentials.password, passwordToValidate)

    if (!user || !isPasswordValid) {
      throw new AppError(400, 'Invalid credentials')
    }

    const userIdString = user._id.toString()
    const accessToken = generateToken({ id: userIdString }, env.JWT_ACCESS_SECRET, '1d')

    clearUserCache(user._id) // limpa o cache para não retornar dados ultrapassados
    return { user: formatUserObject(user), accessToken } // formata o objeto user para não expor a senha
  }

  /**
   * Remove e invalida as entradas de cache ativas associadas ao ID do usuário.
   */
  disconnect = (id: string): void => {
    if (id) clearUserCache(id)
  }
}

export default new AuthService(userService)
