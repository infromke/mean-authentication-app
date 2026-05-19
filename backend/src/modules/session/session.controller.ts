import type { Request, Response } from 'express'
import sessionService from './session.service.js'
import throwHttpError from '../../utils/throwHttpError.js'

// interface para garantir que o TS reconheça o req.user
export interface AuthenticatedRequest extends Request {
  user: {
    id: string
  }
}

class SessionController {
  #sessionService: typeof sessionService

  constructor(sessionServiceInstance: typeof sessionService) {
    this.#sessionService = sessionServiceInstance
  }

  status = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const { id } = req.user

    const user = await this.#sessionService.showStatus(id)
    return res.status(200).json(user)
  }

  login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body

    const capsule = await this.#sessionService.authenticate(password, { email })
    const { user, accessToken } = capsule

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 1 dia
    })

    return res.status(200).json(user)
  }

  logout = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    this.#sessionService.terminate(req.user.id)

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(204).end()
  }
}

export default new SessionController(sessionService)
