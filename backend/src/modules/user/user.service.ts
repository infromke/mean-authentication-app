import type { FilterQuery, ProjectionType } from 'mongoose'
import type { ListQuery, PaginationResult } from '../../shared/types/pagination.types.js'
import type { IUser, IUserDocument } from './user.model.js'
import type { CreateUserDTO } from './user.types.js'
import env from '../../config/env.js'
import userRepository from './user.repository.js'
import formatUserObject from './utils/formatUserObject.js'
import generateToken from '../../shared/utils/generateToken.js'
import { sendEmail } from '../../config/nodemailer.js'
import { getWelcomeMailOptions } from '../otp/utils/generateMail.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'
import cache from '../../shared/lib/cache.js'
import AppError from '../../shared/errors/AppError.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

class UserService {
  #userRepository: typeof userRepository

  constructor(userRepositoryInstance: typeof userRepository) {
    this.#userRepository = userRepositoryInstance
  }

  findAllUsers = async (query: ListQuery): Promise<PaginationResult> => {
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

  findByFilter = async (
    filter: FilterQuery<IUserDocument>,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<any> => {
    const user = await this.#userRepository.findOne(filter, projection)
    if (!user) throw new AppError(404, 'User not found')

    if (projection === '+password') return user // retorna o objeto "user" bruto

    return formatUserObject(user)
  }

  findByEmail = async (
    email: string,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<any | null> => {
    return await this.#userRepository.findOne({ email }, projection)
  }

  findById = async (id: string): Promise<any> => {
    const cacheKey = `user_id_${id}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as any | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const user = await this.#userRepository.findById(id)
    if (!user)
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')

    const formattedUser = formatUserObject(user)

    cache.set(cacheKey, formattedUser) // salva os dados no cache
    return formattedUser
  }

  createUser = async (
    data: CreateUserDTO,
  ): Promise<{ formattedUser: any; accessToken: string }> => {
    const user = await this.#userRepository.create(data)

    const secret = env.JWT_ACCESS_SECRET
    if (!secret)
      throw new AppError(500, 'JWT_ACCESS_SECRET is not defined in environment variables')

    const userIdString = user._id.toString()
    const accessToken = generateToken({ id: userIdString }, secret, '1d')

    await sendEmail(getWelcomeMailOptions(data.name, data.email))

    clearUserCache() // limpa o cache para não retornar dados ultrapassados no próximo GET
    return { formattedUser: formatUserObject(user), accessToken }
  }

  updateUser = async (id: string, data: Partial<IUser>): Promise<any> => {
    const user = await this.#userRepository.updateById(id, data)
    if (!user)
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')

    const formattedUser = formatUserObject(user)

    clearUserCache(id) // limpa o cache para não retornar dados ultrapassados no próximo GET
    return formattedUser
  }

  deleteUser = async (id: string): Promise<void> => {
    const user = await this.#userRepository.deleteById(id)
    if (!user)
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')

    clearUserCache(id) // limpa o cache para não retornar dados ultrapassados no próximo GET
  }
}

export default new UserService(userRepository)
