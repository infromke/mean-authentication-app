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

  /**
   * Checa o status da sessão de redefinição de senha de acordo com a validade
   * do token `passwordToken` (`200 OK`).
   */
  checkResetSession = (req: Request, res: Response): Response => {
    const status = this.#otpService.getPasswordResetStatus(req.cookies.passwordToken)
    return res.status(200).json(status)
  }

  /**
   * Reenvia o código OTP (`200 OK`).
   */
  resendOtpCode = async (
    req: Request<{}, any, ResendCodeDTO>,
    res: Response,
  ): Promise<Response> => {
    const { type } = req.body

    const filter = type === 'VERIFY' ? { _id: req.user!.id } : { email: res.locals.reset['email'] }

    await this.#otpService.resendOtpCode(type, filter)
    return res.status(200).json({
      message:
        type === 'VERIFY'
          ? 'A new code has been sent'
          : 'If the e-mail is valid, a new code has been sent',
    })
  }

  /**
   * Solicita a verificação de e-mail e retorna o hiperlink para o próximo passo do fluxo (`200 OK`).
   */
  requestEmailVerification = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.user!
    await this.#otpService.sendEmailVerificationCode(id)

    return res.status(200).json({
      nextStep: {
        href: '/otps/email-verification/check',
        method: 'POST',
      },
    })
  }

  /**
   * Valida a conta do usuário logado (`200 OK`).
   */
  verifyEmailAccount = async (
    req: Request<any, any, VerifyEmailDTO>,
    res: Response,
  ): Promise<Response> => {
    const { id } = req.user!
    const { otp } = req.body
    await this.#otpService.confirmEmailVerification(id, otp)
    return res.status(204).end()
  }

  /**
   * Solicita a redefinição de senha por e-mail e gera o cookie temporário `resetEmailToken` (de 5 min).
   */
  requestPasswordReset = async (
    req: Request<{}, any, RequestResetDTO>,
    res: Response,
  ): Promise<Response> => {
    const { email } = req.body

    const resetEmailToken = await this.#otpService.sendPasswordResetCode({ email })

    res.cookie('resetEmailToken', resetEmailToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 5 * 60 * 1000, // 5 minutos
    })

    return res.status(200).json({
      message: 'If the e-mail is valid, a code has been sent',
    })
  }

  /**
   * Valida o código OTP, gera o cookie autorizador `passwordToken` (de 15 min)
   * e retorna o hiperlink para o próximo passo do fluxo (`200 OK`).
   */
  verifyPasswordResetCode = async (
    req: Request<{}, any, VerifyResetDTO>,
    res: Response,
  ): Promise<Response> => {
    const { otp } = req.body
    const { email } = res.locals.reset

    const passwordToken = await this.#otpService.confirmPasswordResetCode({ email }, otp)

    res.clearCookie('resetEmailToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
    })

    res.cookie('passwordToken', passwordToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production', // usar TRUE em HTTPS
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutos
    })

    return res.status(200).json({
      nextStep: {
        href: '/otps/password-reset',
        method: 'PATCH',
      },
    })
  }

  /**
   * Atualiza a senha do usuário, limpa a sessão de cookies e retorna os dados atualizados (`200 OK`).
   */
  resetPassword = async (
    req: Request<{}, any, ResetPasswordDTO>,
    res: Response,
  ): Promise<Response> => {
    const { newPassword } = req.body
    const { email } = res.locals.reset

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
