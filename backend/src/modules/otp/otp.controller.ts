import type { Request, Response } from 'express'
import type {
  RequestResetDTO,
  ResendCodeDTO,
  ResetPasswordDTO,
  VerifyEmailDTO,
  VerifyResetDTO,
} from './otp.types.js'
import env from '../../config/env.js'
import otpService from './otp.service.js'

class OtpController {
  #otpService: typeof otpService

  constructor(otpServiceInstance: typeof otpService) {
    this.#otpService = otpServiceInstance
  }

  checkResetSession = (req: Request, res: Response): Response => {
    const status = this.#otpService.getPasswordResetStatus(req.cookies.passwordToken)
    return res.status(200).json(status)
  }

  resendOtpCode = async (
    req: Request<{}, any, ResendCodeDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email, type } = req.body
    const filter = type === 'VERIFY' ? { _id: req.user!.id } : { email: email }

    await this.#otpService.resendOtpCode(type, filter)
    return res.status(200).json({
      message:
        type === 'VERIFY'
          ? 'A new code has been sent'
          : 'If the e-mail is valid, a new code has been sent',
    })
  }

  requestEmailVerification = async (
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.params

    await this.#otpService.sendEmailVerificationCode(id)
    return res.status(204).end()
  }

  verifyEmailAccount = async (
    req: Request<{ id: string }, any, VerifyEmailDTO>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.params
    const { otp } = req.body

    await this.#otpService.confirmEmailVerification(id, otp)
    return res.status(204).end()
  }

  requestPasswordReset = async (
    req: Request<{}, any, RequestResetDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email } = req.body

    await this.#otpService.sendPasswordResetCode({ email })
    return res.status(200).json({
      message: 'If the e-mail is valid, a code has been sent',
    })
  }

  verifyPasswordResetCode = async (
    req: Request<{}, any, VerifyResetDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email, otp } = req.body

    const passwordToken = await this.#otpService.confirmPasswordResetCode(otp, { email })

    res.cookie('passwordToken', passwordToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
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

    const user = await this.#otpService.resetUserPassword({ email }, newPassword)

    res.clearCookie('passwordToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    return res.status(200).json(user)
  }
}

export default new OtpController(otpService)
