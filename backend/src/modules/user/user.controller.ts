import type { Request, Response } from 'express'

import env from '../../config/env.js'

import userService from './user.service.js'
import type { CreateUserDTO } from './user.types.js'

class UserController {
  #userService: typeof userService

  constructor(userServiceInstance: typeof userService) {
    this.#userService = userServiceInstance
  }

  /**
   * Retorna uma lista de usuários filtrada ou paginada (`200 OK`).
   */
  getAll = async (req: Request, res: Response): Promise<Response> => {
    const users = await this.#userService.findAllUsers(req.query)
    return res.status(200).json(users)
  }

  /**
   * Retorna os dados de um usuário específico por ID (`200 OK`).
   */
  getById = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    const { id } = req.params

    const user = await this.#userService.findById(id)
    return res.status(200).json(user)
  }

  /**
   * Registra um novo usuário e injeta o `accessToken` nos cookies HTTP (`201 CREATED`).
   */
  create = async (req: Request<{}, any, CreateUserDTO>, res: Response): Promise<Response> => {
    const { name, email, password } = req.body
    const { formattedUser, accessToken } = await this.#userService.createUser({
      name,
      email,
      password,
    })

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    })

    return res.status(201).json(formattedUser)
  }

  /**
   * Atualiza parcialmente os dados cadastrais do usuário (`200 OK`).
   */
  update = async (
    req: Request<{ id: string }, any, Partial<CreateUserDTO>>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.params
    const updates: Partial<CreateUserDTO> = {}

    if (req.body.name !== undefined) updates.name = req.body.name
    if (req.body.email !== undefined) updates.email = req.body.email
    if (req.body.password !== undefined) updates.password = req.body.password

    const user = await this.#userService.updateUser(id, updates)
    return res.status(200).json(user)
  }

  /**
   * Exclui o usuário do sistema e limpa o cookie `accessToken` do navegador (`204 No Content`).
   */
  remove = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    const { id } = req.params

    await this.#userService.deleteUser(id)

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(204).end()
  }
}

export default new UserController(userService)
