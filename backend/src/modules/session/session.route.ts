import { Router, type RequestHandler } from 'express'
import sessionController from './session.controller.js'
import { sessionLimiter } from '../../middlewares/rateLimiter.js'
import handleValidation from '../../middlewares/handleValidation.js'
import loginSchema from './session.schema.js'
import verifyAccessToken from '../../middlewares/verifyAccessToken.js'
import { isAuthenticated } from '../../middlewares/isLoggedIn.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
// tipo de Request customizável onde "user" (req.user) pode ou não estar presente
type RouteHandler = RequestHandler<
  any, // Params
  any, // ResBody
  any, // ReqBody
  any, // ReqQuery
  Record<string, unknown> // ResLocals
>

const router = Router()

//  --- PUBLIC ROUTES ---

// @route POST /sessions/login
router.post(
  '/login',
  isAuthenticated,
  sessionLimiter,
  handleValidation(loginSchema),
  sessionController.login as RouteHandler,
)

//  --- PRIVATE ROUTES ---

// @route GET /sessions/me
router.get(
  '/me',
  verifyAccessToken as unknown as RouteHandler,
  sessionController.status as unknown as RouteHandler,
)

// @route POST /sessions/logout
router.post(
  '/logout',
  verifyAccessToken as unknown as RouteHandler,
  sessionController.logout as unknown as RouteHandler,
)

export default router
