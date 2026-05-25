import userRepository from './user.repository.js'
import formatUserObject from '../../utils/formatUserObject.js'
import generateToken from '../../utils/generateToken.js'
import { sendEmail } from '../../config/nodemailer.js'
import { getWelcomeMailOptions } from '../../utils/generateMail.js'
import clearUserCache from '../../utils/clearUserCache.js'
import cache from '../../lib/cache.js'
import throwHttpError from '../../utils/throwHttpError.js'
import type { FilterQuery, ProjectionType } from 'mongoose'
import type { CreateUserDTO, IUser, IUserDocument } from './user.types.js'

// query de listagem
interface ListQuery {
  page?: string
  size?: string
  sort?: string
}

// para o objeto de paginação
interface PaginationResult {
  content: any[] // Substitua por seu tipo de retorno do formatUserObject se houver
  first: boolean
  last: boolean
  number: number
  numberOfElements: number
  size: number
  totalElements: number
  totalPages: number
}

class UserService {
  #userRepository: typeof userRepository

  constructor(userRepositoryInstance: typeof userRepository) {
    this.#userRepository = userRepositoryInstance
  }

  list = async (query: ListQuery): Promise<PaginationResult> => {
    const cacheKey = `users_list_${JSON.stringify(query)}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as PaginationResult | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const page = Math.max(0, parseInt(query.page || '0', 0))
    const size = Math.max(1, parseInt(query.size || '10', 10))
    const sortParam = query.sort || 'createdAt,desc'

    // parse do sort
    const [field, direction] = sortParam.split(',')
    const sortOrder = direction === 'desc' ? -1 : 1

    const { users, totalElements } = await this.#userRepository.findAll({
      page,
      size,
      sortField: field || 'createdAt',
      sortOrder,
    })

    // se existir 11 usuários e o size for 10, haverá 2 páginas
    const totalPages = Math.ceil(totalElements / size)

    const paginationData: PaginationResult = {
      content: users.map((user) => formatUserObject(user)),
      first: page === 0,
      last: page >= totalPages - 1,
      number: page,
      numberOfElements: users.length,
      size,
      totalElements,
      totalPages,
    }

    cache.set(cacheKey, paginationData) // salva os dados no cache
    return paginationData
  }

  find = async (
    filter: FilterQuery<IUserDocument>,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<any> => {
    const user = await this.#userRepository.findOne(filter, projection)
    if (!user) throwHttpError(400, 'User not found')

    if (projection === '+password') return user // retorna o objeto "user" bruto

    return formatUserObject(user)
  }

  show = async (id: string): Promise<any> => {
    const cacheKey = `user_id_${id}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as any | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const user = await this.#userRepository.findById(id)
    if (!user) throwHttpError(400, 'User not found')

    const formattedUser = formatUserObject(user)

    cache.set(cacheKey, formattedUser) // salva os dados no cache
    return formattedUser
  }

  store = async (
    data: Partial<CreateUserDTO>,
  ): Promise<{ formattedUser: any; accessToken: string }> => {
    const user = await this.#userRepository.create(data)

    const secret = process.env.JWT_ACCESS_SECRET as string
    if (!secret) throwHttpError(500, 'JWT_ACCESS_SECRET is not defined in environment variables')

    const userIdString = user._id.toString()

    const accessToken = generateToken({ id: userIdString }, secret, '1d')
    await sendEmail(getWelcomeMailOptions(data.name, data.email))

    clearUserCache() // limpa o cache para não retornar dados ultrapassados no próximo GET
    return { formattedUser: formatUserObject(user), accessToken }
  }

  update = async (id: string, data: Partial<IUser>): Promise<any> => {
    const user = await this.#userRepository.update(id, data)
    if (!user) throwHttpError(400, 'User not found')

    const formattedUser = formatUserObject(user)

    clearUserCache(id) // limpa o cache para não retornar dados ultrapassados no próximo GET
    return formattedUser
  }

  destroy = async (id: string): Promise<void> => {
    const user = await this.#userRepository.remove(id)
    if (!user) throwHttpError(400, 'User not found')

    clearUserCache(id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }
}

export default new UserService(userRepository)
