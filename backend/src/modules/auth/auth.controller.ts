import type { Request, Response } from 'express'
import env from '../../config/env.js'
import sessionService from './auth.service.js'

class SessionController {
  #sessionService: typeof sessionService

  constructor(sessionServiceInstance: typeof sessionService) {
    this.#sessionService = sessionServiceInstance
  }

  status = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.user!
    const user = await this.#sessionService.showStatus(id)
    return res.status(200).json(user)
  }

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body

    const capsule = await this.#sessionService.authenticate({ email, password })
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
    this.#sessionService.terminate(req.user!.id)

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(204).end()
  }
}

export default new SessionController(sessionService)
