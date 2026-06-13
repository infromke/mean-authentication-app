import { Router } from 'express'
import otpController from './otp.controller.js'
import verifyAccessToken from '../auth/middlewares/verifyAccessToken.js'
import verifyResetEmailToken from '../auth/middlewares/verifyResetEmailToken.js'
import verifyPasswordToken from '../auth/middlewares/verifyPasswordToken.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import {
  checkResetSchema,
  checkVerificationSchema,
  requestResetSchema,
  resendOtpSchema,
  resetPasswordSchema,
} from './otp.schema.js'
import { resendOtpFlow } from '../auth/middlewares/tollPlaza.js'
import { otpSendLimiter, otpVerifyLimiter } from '../../shared/middlewares/rateLimiter.js'
import { isGuest } from '../auth/middlewares/isLoggedIn.js'

const router = Router()

/**
 * -----------------------------------------------------------------------------
 * PUBLIC ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   POST /otps/password-reset/request
 * @desc    Inicia o fluxo de recuperação de senha gerando e enviando o primeiro OTP por e-mail.
 * @access  Público (Apenas convidados)
 */
router.post(
  '/password-reset/request',
  isGuest,
  handleValidation(requestResetSchema),
  otpController.requestPasswordReset,
)

/**
 * -----------------------------------------------------------------------------
 * PRIVATE ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   GET /otps/password-reset/me
 * @desc    Verifica a integridade e expiração do cookie de sessão de redefinição de senha.
 * @access  Privado (Requer cookie `passwordToken` ativo)
 */
router.get('/password-reset/me', verifyPasswordToken, otpController.checkResetSession)

/**
 * @route   POST /otps/resend
 * @desc    Reenvia o código OTP de forma dinâmica, baseando-se no contexto atual do fluxo.
 * @access  Dinâmico (Protegido por rate limiter e cooldown por cache de 60s)
 */
router.post(
  '/resend',
  otpSendLimiter,
  resendOtpFlow,
  handleValidation(resendOtpSchema),
  otpController.resendOtpCode,
)

/**
 * @route   POST /otps/email-verification
 * @desc    Solicita a geração e envio de um código de verificação para a conta logada.
 * @access  Privado (Requer token de acesso válido)
 */
router.post('/email-verification', verifyAccessToken, otpController.requestEmailVerification)

/**
 * @route   POST /otps/email-verification/check
 * @desc    Valida o código OTP de verificação enviado ao e-mail para marcar a conta como verificada.
 * @access  Privado (Requer token de acesso válido / Protegido por Rate Limiter)
 */
router.post(
  '/email-verification/check',
  verifyAccessToken,
  otpVerifyLimiter,
  handleValidation(checkVerificationSchema),
  otpController.verifyEmailAccount,
)

/**
 * @route   POST /otps/password-reset/check
 * @desc    Valida o código OTP de recuperação de senha e gera o cookie autorizador de alteração final.
 * @access  Privado (Requer cookie resetEmailToken ativo / Protegido por Rate Limiter)
 */
router.post(
  '/password-reset/check/',
  otpVerifyLimiter,
  verifyResetEmailToken,
  handleValidation(checkResetSchema),
  otpController.verifyPasswordResetCode,
)

/**
 * @route   PATCH /otps/password-reset
 * @desc    Aplica a substituição da senha do usuário utilizando a sessão validada.
 * @access  Privado (Requer cookie `passwordToken` ativo)
 */
router.patch(
  '/password-reset',
  verifyPasswordToken,
  handleValidation(resetPasswordSchema),
  otpController.resetPassword,
)

export default router
