import { Router } from 'express'
import authController from './auth.controller.js'
import { sessionLimiter } from '../../shared/middlewares/rateLimiter.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import loginSchema from './auth.schema.js'
import verifyAccessToken from './middlewares/verifyAccessToken.js'
import { isAuthenticated } from './middlewares/isLoggedIn.js'

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
  handleValidation(loginSchema),
  authController.login,
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

export default router
