import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../session/session.controller.js'
import type {
  RequestResetDTO,
  ResendCodeDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
  VerifyResetDTO,
} from './otp.types.js'
import otpService from './otp.service.js'

class OtpController {
  #otpService: typeof otpService

  constructor(otpServiceInstance: typeof otpService) {
    this.#otpService = otpServiceInstance
  }

  status = async (req: Request, res: Response): Promise<Response> => {
    const status = await this.#otpService.showStatus(req.cookies.passwordToken)
    return res.status(200).json(status)
  }

  requestVerification = async (req: Request<{ id: string }>, res: Response): Promise<Response> => {
    const { id } = req.params

    await this.#otpService.sendVerification(id)
    return res.status(204).end()
  }

  requestReset = async (
    req: Request<{}, any, RequestResetDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email } = req.body

    await this.#otpService.sendReset({ email })
    return res.status(200).json({
      message: 'If the e-mail is valid, a code has been sent',
    })
  }

  resendCode = async (
    req: AuthenticatedRequest & Request<{}, any, ResendCodeDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email, type } = req.body
    const filter = type === 'VERIFY' ? { _id: req.user.id } : { email: email! }

    await this.#otpService.resend(type, filter)
    return res.status(200).json({
      message:
        type === 'VERIFY'
          ? 'A new code has been sent'
          : 'If the e-mail is valid, a new code has been sent',
    })
  }

  verifyEmail = async (
    req: Request<{ id: string }, any, VerifyEmailDTO>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.params
    const { otp } = req.body

    await this.#otpService.validateEmail(id, otp)
    return res.status(204).end()
  }

  verifyReset = async (req: Request<{}, any, VerifyResetDTO>, res: Response): Promise<Response> => {
    const { email, otp } = req.body

    const passwordToken = await this.#otpService.validateReset(otp, { email })

    res.cookie('passwordToken', passwordToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    })

    return res.status(204).end()
  }

  resetPassword = async (
    req: Request<{}, any, ResetPasswordDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email, newPassword } = req.body

    const user = await this.#otpService.resetPassword({ email }, newPassword)

    res.clearCookie('passwordToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(200).json(user)
  }
}

export default new OtpController(otpService)
