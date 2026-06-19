import type { ProjectionType } from 'mongoose'

import env from '../../config/env.js'
import { sendEmail } from '../../config/nodemailer.js'

import AppError from '../../shared/errors/AppError.js'
import cache from '../../shared/lib/cache.js'
import type { ListQuery, PaginationResult } from '../../shared/types/pagination.types.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'
import generateToken from '../../shared/utils/generateToken.js'

import { getWelcomeMailOptions } from '../otp/utils/generateMail.js'

import type { IUser, IUserDocument, IUserPersistence } from './user.model.js'
import userRepository from './user.repository.js'
import type { CreateUserDTO } from './user.types.js'
import formatUserObject, { type FormattedUser } from './utils/formatUserObject.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

class UserService {
  #userRepository: typeof userRepository

  constructor(userRepositoryInstance: typeof userRepository) {
    this.#userRepository = userRepositoryInstance
  }

  /**
   * Recupera uma lista paginada de usuários com suporte a cache dinâmico baseado na query.
   */
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

  /**
   * Busca um usuário pelo e-mail, podendo retornar null. O tratamento de erros deve ser interno.
   */
  findByEmail = async (
    email: string,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<IUserPersistence | null> => await this.#userRepository.findOne({ email }, projection)

  /**
   * Recupera o documento original e mutável do usuário diretamente da camada de persistência.
   */
  findEntityById = async (id: string): Promise<IUserPersistence> => {
    const user = await this.#userRepository.findById(id)

    if (!user)
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')

    return user
  }

  /**
   * Recupera a projeção pública e higienizada (sem senha) do usuário utilizando a estratégia Cache-Aside.
   */
  getSummaryById = async (id: string): Promise<FormattedUser> => {
    const cacheKey = `user_id_${id}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as FormattedUser | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const user = await this.findEntityById(id)
    const formattedUser = formatUserObject(user)

    cache.set(cacheKey, formattedUser)
    return formattedUser
  }

  /**
   * Persiste o usuário, gera o token de acesso, dispara o e-mail de boas-vindas
   * assincronamente e invalida o cache global de listagem.
   */
  createUser = async (
    data: CreateUserDTO,
  ): Promise<{ newUser: FormattedUser; accessToken: string }> => {
    const rawUser = await this.#userRepository.create(data)

    const accessToken = generateToken({ id: rawUser._id.toString() }, env.JWT_ACCESS_SECRET, '1d')
    await sendEmail(getWelcomeMailOptions(data.name, data.email))

    clearUserCache()
    return { newUser: formatUserObject(rawUser), accessToken }
  }

  /**
   * Atualiza parcialmente os dados do usuário e invalida seus caches específicos por ID.
   */
  updateUser = async (id: string, data: Partial<IUser>): Promise<FormattedUser> => {
    const updatedUser = await this.#userRepository.updateById(id, data)

    if (!updatedUser) {
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')
    }

    clearUserCache(id)
    return formatUserObject(updatedUser)
  }

  /**
   * Remove permanentemente o usuário do banco e limpa todas as suas entradas de cache ativas.
   */
  deleteUser = async (id: string): Promise<void> => {
    const deletedUser = await this.#userRepository.deleteById(id)

    if (!deletedUser)
      throw new AppError(404, isEnvDev ? `User with ID '${id}' not found` : 'User not found')

    clearUserCache(id)
  }
}

export default new UserService(userRepository)
