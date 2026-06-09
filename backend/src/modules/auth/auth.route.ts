import { Router } from 'express'
import sessionController from './auth.controller.js'
import { sessionLimiter } from '../../shared/middlewares/rateLimiter.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import loginSchema from './auth.schema.js'
import verifyAccessToken from './middlewares/verifyAccessToken.js'
import { isAuthenticated } from './middlewares/isLoggedIn.js'

const router = Router()

//  --- PUBLIC ROUTES ---

// @route POST /sessions/login
router.post(
  '/login',
  isAuthenticated,
  sessionLimiter,
  handleValidation(loginSchema),
  sessionController.login,
)

//  --- PRIVATE ROUTES ---

// @route GET /sessions/me
router.get('/me', verifyAccessToken, sessionController.status)

// @route POST /sessions/logout
router.post('/logout', verifyAccessToken, sessionController.logout)

export default router
