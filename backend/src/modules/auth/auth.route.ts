import { Router } from 'express'

import {
  otpSendLimiter,
  otpVerifyLimiter,
  sessionLimiter,
} from '../../shared/middlewares/rateLimiter.js'
import validateSchema from '../../shared/middlewares/validateSchema.js'

import {
  checkResetSchema,
  checkVerificationSchema,
  loginSchema,
  requestResetSchema,
  resendOtpSchema,
  resetPasswordSchema,
} from '../auth/auth.schema.js'

import authController from './controllers/auth.controller.js'
import identityController from './controllers/identity.controller.js'
import { isAuthenticated, isGuest } from './middlewares/isLoggedIn.js'
import verifyAccessToken from './middlewares/verifyAccessToken.js'
import verifyOtpContext from './middlewares/verifyOtpContext.js'
import verifyPasswordToken from './middlewares/verifyPasswordToken.js'
import verifyResetEmailToken from './middlewares/verifyResetEmailToken.js'

const router = Router()

/**
 * -----------------------------------------------------------------------------
 * PUBLIC ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   POST /auth/login
 * @desc    Autentica as credenciais do usuário e anexa o cookie de acesso à sessão.
 * @access  Público (Bloqueia usuários já logados / Protegido por Rate Limiter)
 */
router.post(
  '/login',
  isAuthenticated,
  sessionLimiter,
  validateSchema(loginSchema),
  authController.login,
)

/**
 * @route   POST /auth/password-reset/request
 * @desc    Inicia o fluxo de recuperação de senha gerando e enviando o primeiro OTP por e-mail.
 * @access  Público (Apenas convidados)
 */
router.post(
  '/password-reset/request',
  isGuest,
  validateSchema(requestResetSchema),
  identityController.requestPasswordReset,
)

/**
 * -----------------------------------------------------------------------------
 * PRIVATE ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   GET /auth/me
 * @desc    Retorna os dados do perfil do usuário atualmente autenticado na sessão.
 * @access  Privado (Requer token de acesso válido)
 */
router.get('/me', verifyAccessToken, authController.checkUserSession)

/**
 * @route   POST /auth/logout
 * @desc    Revoga a sessão ativa do usuário limpando o cookie de acesso do navegador.
 * @access  Privado (Apenas para sessões autenticadas)
 */
router.post('/logout', verifyAccessToken, authController.logout)

/**
 * @route   GET /auth/password-reset/me
 * @desc    Verifica a integridade e expiração do cookie de sessão de redefinição de senha.
 * @access  Privado (Requer cookie `passwordToken` ativo)
 */
router.get('/password-reset/me', verifyPasswordToken, identityController.checkResetSession)

/**
 * @route   POST /auth/resend
 * @desc    Reenvia o código OTP de forma dinâmica, baseando-se no contexto atual do fluxo.
 * @access  Dinâmico (Protegido por rate limiter e cooldown por cache de 60s)
 */
router.post(
  '/resend',
  otpSendLimiter,
  validateSchema(resendOtpSchema),
  verifyOtpContext,
  identityController.resendOtpCode,
)

/**
 * @route   POST /auth/email-verification
 * @desc    Solicita a geração e envio de um código de verificação para a conta logada.
 * @access  Privado (Requer token de acesso válido)
 */
router.post('/email-verification', verifyAccessToken, identityController.requestEmailVerification)

/**
 * @route   POST /auth/email-verification/check
 * @desc    Valida o código OTP de verificação enviado ao e-mail para marcar a conta como verificada.
 * @access  Privado (Requer token de acesso válido / Protegido por Rate Limiter)
 */
router.post(
  '/email-verification/check',
  verifyAccessToken,
  otpVerifyLimiter,
  validateSchema(checkVerificationSchema),
  identityController.verifyEmailAccount,
)

/**
 * @route   POST /auth/password-reset/check
 * @desc    Valida o código OTP de recuperação de senha e gera o cookie autorizador de alteração final.
 * @access  Privado (Requer cookie resetEmailToken ativo / Protegido por Rate Limiter)
 */
router.post(
  '/password-reset/check/',
  otpVerifyLimiter,
  verifyResetEmailToken,
  validateSchema(checkResetSchema),
  identityController.verifyPasswordResetCode,
)

/**
 * @route   PATCH /auth/password-reset
 * @desc    Aplica a substituição da senha do usuário utilizando a sessão validada.
 * @access  Privado (Requer cookie `passwordToken` ativo)
 */
router.patch(
  '/password-reset',
  verifyPasswordToken,
  validateSchema(resetPasswordSchema),
  identityController.resetPassword,
)

export default router
