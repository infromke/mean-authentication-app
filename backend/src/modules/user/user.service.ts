import type { ProjectionType } from 'mongoose'

import env from '../../config/env.js'

import AppError from '../../shared/errors/AppError.js'
import cache from '../../shared/lib/cache.js'
import mailService from '../../shared/mail/mail.service.js'
import type { PaginationResult } from '../../shared/types/pagination.types.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'
import generateToken from '../../shared/utils/generateToken.js'

import type { IUser, IUserDocument, IUserPersistence } from './user.model.js'
import userRepository from './user.repository.js'
import type { CreateUserDTO, GetAllUsersQuery } from './user.types.js'
import formatUserObject, { type FormattedUser } from './utils/formatUserObject.js'

export class UserService {
  #userRepository: typeof userRepository
  #mailService: typeof mailService

  constructor(
    userRepositoryInstance: typeof userRepository,
    mailServiceInstance: typeof mailService,
  ) {
    this.#userRepository = userRepositoryInstance
    this.#mailService = mailServiceInstance
  }

  /**
   * Recupera uma lista paginada de usuários com suporte a cache dinâmico baseado na query.
   */
  findAllUsers = async (query: GetAllUsersQuery): Promise<PaginationResult> => {
    const cacheKey = `users_list_${JSON.stringify(query)}`

    // tenta buscar o resultado da requisição no cache primeiro
    const cachedData = cache.get(cacheKey) as PaginationResult | undefined
    if (cachedData) return cachedData

    // se não houver cache, executa a lógica normal abaixo
    const { search, verified, page, size, sort } = query

    // traduz o campo "id" para o padrão do MongoDB se necessário
    const sortField = sort.field === 'id' ? '_id' : sort.field
    const sortOrder = sort.direction === 'asc' ? 1 : -1

    const { users, totalElements } = await this.#userRepository.findAll({
      search,
      verified,
      page,
      size,
      sortField,
      sortOrder,
    })

    // se existir 11 usuários e o size for 10, haverá 2 páginas
    const totalPages = Math.ceil(totalElements / size)

    const paginationData: PaginationResult = {
      content: users.map((user) => formatUserObject(user)),
      first: page === 0,
      last: page >= (totalPages === 0 ? 0 : totalPages - 1),
      number: page,
      numberOfElements: users.length,
      size,
      totalElements,
      totalPages,
    }

    cache.set(cacheKey, paginationData)
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
   * @throws {AppError} Lança um erro `404 Not Found` se o usuário com o ID especificado não for encontrado.
   */
  findEntityById = async (id: string): Promise<IUserPersistence> => {
    const user = await this.#userRepository.findById(id)

    if (!user) throw new AppError(404, ['User not found', `User with ID '${id}' not found`])

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
   * Persiste o usuário, gera o token de acesso, dispara o e-mail de boas-vindas assincronamente
   * e invalida o cache global de listagem.
   * @throws {AppError} Lança um erro `409 Conflict` com code "EMAIL_ALREADY_IN_USE" se o endereço de e-mail já estiver cadastrado.
   */
  createUser = async (
    data: CreateUserDTO,
  ): Promise<{ newUser: FormattedUser; accessToken: string }> => {
    // verifica se o usuário já existe
    const existingUser = await this.findByEmail(data.email)

    if (existingUser)
      throw new AppError(409, 'The provided e-mail is already in use', 'EMAIL_ALREADY_IN_USE')

    const rawUser = await this.#userRepository.create(data)
    const accessToken = generateToken({ id: rawUser._id.toString() }, env.JWT_ACCESS_SECRET, '1d')
    await this.#mailService.sendWelcomeEmail(data.name, data.email)
    clearUserCache()
    return { newUser: formatUserObject(rawUser), accessToken }
  }

  /**
   * Atualiza parcialmente os dados do usuário e invalida seus caches específicos por ID.
   * @throws {AppError} Lança um erro `409 Conflict` com code "EMAIL_ALREADY_IN_USE" se o novo e-mail já pertencer a outro usuário.
   * @throws {AppError} Lança um erro `404 Not Found` se o usuário não for localizado para a atualização.
   */
  updateUser = async (id: string, data: Partial<IUser>): Promise<FormattedUser> => {
    // cópia do payload só pra gerenciar mutações de estado sem alterar o original
    const updatePayload: Partial<IUser> = { ...data }

    // verifica se o usuário já existe
    if (data.email) {
      const existingUser = await this.findByEmail(data.email)

      // lança um erro se o e-mail pertence a OUTRO usuário
      if (existingUser && existingUser._id.toString() !== id) {
        throw new AppError(409, 'The provided e-mail is already in use', 'EMAIL_ALREADY_IN_USE')
      }

      // se o e-mail é de fato novo, o estado de verificado é revertido
      if (!existingUser || existingUser._id.toString() === id) {
        updatePayload.isAccountVerified = false
      }
    }

    const updatedUser = await this.#userRepository.updateById(id, updatePayload)
    if (!updatedUser) throw new AppError(404, ['User not found', `User with ID '${id}' not found`])

    clearUserCache(id)
    return formatUserObject(updatedUser)
  }

  /**
   * Remove permanentemente o usuário do banco e limpa todas as suas entradas de cache ativas.
   * @throws {AppError} Lança um erro `404 Not Found` se o usuário não existir na base de dados.
   */
  deleteUser = async (id: string): Promise<void> => {
    const deletedUser = await this.#userRepository.deleteById(id)

    if (!deletedUser) throw new AppError(404, ['User not found', `User with ID '${id}' not found`])

    clearUserCache(id)
  }
}

export default new UserService(userRepository, mailService)
