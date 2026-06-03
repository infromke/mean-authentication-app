import type { FilterQuery } from 'mongoose'
import type { IUserDocument } from '../user/user.types.js'
import userService from '../user/user.service.js'
import throwHttpError from '../../utils/throwHttpError.js'
import generateToken from '../../utils/generateToken.js'
import { validatePassword } from '../../utils/hash.js'
import formatUserObject from '../../utils/formatUserObject.js'
import cache from '../../lib/cache.js'
import clearUserCache from '../../utils/clearUserCache.js'

// interface para os dados de login do usuário
interface UserCredentials {
  email: FilterQuery<IUserDocument>
  password: string
}

class SessionService {
  #userService: typeof userService

  constructor(userServiceInstance: typeof userService) {
    this.#userService = userServiceInstance
  }

  showStatus = async (id: string): Promise<any> => {
    const cacheKey = `user_session_${id}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as any | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const user = await this.#userService.show(id)
    cache.set(cacheKey, user, 120) // salva os dados no cache com TTL de 2 min
    return user
  }

  authenticate = async (
    credentials: UserCredentials,
  ): Promise<{ user: any; accessToken: string }> => {
    const user = await this.#userService.find(credentials.email, '+password') // recebe um objeto "user" bruto

    if (!(await validatePassword(credentials.password, user.password)))
      throw throwHttpError(400, 'Invalid credentials')

    const secret = process.env.JWT_ACCESS_SECRET as string
    if (!secret)
      throw throwHttpError(500, 'JWT_ACCESS_SECRET is not defined in environment variables')

    const userIdString = user._id.toString()
    const accessToken = generateToken({ id: userIdString }, secret, '1d')

    clearUserCache(user._id) // limpa o cache para não retornar dados ultrapassados
    return { user: formatUserObject(user), accessToken } // formata o objeto user para não expor a senha
  }

  terminate = (id: string): void => {
    if (id) clearUserCache(id)
  }
}

export default new SessionService(userService)
