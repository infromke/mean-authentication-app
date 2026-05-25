import type { Request, Response } from 'express'
import type { CreateUserDTO } from './user.types.js'
import userService from './user.service.js'

class UserController {
  #userService: typeof userService

  constructor(userServiceInstance: typeof userService) {
    this.#userService = userServiceInstance
  }

  getAll = async (req: Request, res: Response): Promise<Response> => {
    const users = await this.#userService.list(req.query)
    return res.status(200).json(users)
  }

  getById = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    const { id } = req.params

    const user = await this.#userService.show(id)
    return res.status(200).json(user)
  }

  create = async (req: Request<{}, any, CreateUserDTO>, res: Response): Promise<Response> => {
    const { name, email, password } = req.body
    const data = { name, email, password }

    const { formattedUser, accessToken } = await this.#userService.store(data)

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    })

    return res.status(201).json(formattedUser)
  }

  update = async (
    req: Request<{ id: string }, any, Partial<CreateUserDTO>>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.params
    const updates: Partial<CreateUserDTO> = {}

    if (req.body.name !== undefined) updates.name = req.body.name
    if (req.body.email !== undefined) updates.email = req.body.email
    if (req.body.password !== undefined) updates.password = req.body.password

    const user = await this.#userService.update(id, updates)
    return res.status(200).json(user)
  }

  destroy = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    const { id } = req.params

    await this.#userService.destroy(id)

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(204).end()
  }
}

export default new UserController(userService)
