import type { Request, Response } from 'express'
import env from '../../config/env.js'
import authService from './auth.service.js'

class AuthController {
  #authService: typeof authService

  constructor(authServiceInstance: typeof authService) {
    this.#authService = authServiceInstance
  }

  status = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.user!
    const user = await this.#authService.getAuthenticatedUser(id)
    return res.status(200).json(user)
  }

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body

    const capsule = await this.#authService.authenticate({ email, password })
    const { user, accessToken } = capsule

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    })

    return res.status(200).json(user)
  }

  logout = async (req: Request, res: Response): Promise<Response> => {
    this.#authService.disconnect(req.user!.id)

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(204).end()
  }
}

export default new AuthController(authService)
