import { Router } from 'express'
import authController from './auth.controller.js'
import { sessionLimiter } from '../../shared/middlewares/rateLimiter.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import loginSchema from './auth.schema.js'
import verifyAccessToken from './middlewares/verifyAccessToken.js'
import { isAuthenticated } from './middlewares/isLoggedIn.js'

const router = Router()

//  --- PUBLIC ROUTES ---

// @route POST /auth/login
router.post(
  '/login',
  isAuthenticated,
  sessionLimiter,
  handleValidation(loginSchema),
  authController.login,
)

//  --- PRIVATE ROUTES ---

// @route GET /auth/me
router.get('/me', verifyAccessToken, authController.status)

// @route POST /auth/logout
router.post('/logout', verifyAccessToken, authController.logout)

export default router
