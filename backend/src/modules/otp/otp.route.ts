import { Router, type RequestHandler } from 'express'
import otpController from './otp.controller.js'
import verifyPasswordToken from '../../middlewares/verifyPasswordToken.js'
import handleValidation from '../../middlewares/handleValidation.js'
import { paramsIdSchema } from '../../utils/common.schema.js'
import {
  checkResetSchema,
  checkVerificationSchema,
  requestResetSchema,
  resendOtpSchema,
  resetPasswordSchema,
} from './otp.schema.js'
import { resendOtpFlow } from '../../middlewares/tollPlaza.js'
import { otpSendLimiter, otpVerifyLimiter } from '../../middlewares/rateLimiter.js'
import { isGuest } from '../../middlewares/isLoggedIn.js'
import verifyAccessToken from '../../middlewares/verifyAccessToken.js'

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

// @route POST /otps/password-reset/request
router.post(
  '/password-reset/request',
  isGuest,
  handleValidation(requestResetSchema),
  otpController.requestReset as RouteHandler,
)

// @route POST /otps/password-reset/check
router.post(
  '/password-reset/check/',
  otpVerifyLimiter,
  handleValidation(checkResetSchema),
  otpController.verifyReset as RouteHandler,
)

//  --- PRIVATE ROUTES ---

// @route POST /otps/email-verification/:id
router.post(
  '/email-verification/:id',
  verifyAccessToken as unknown as RouteHandler,
  handleValidation(paramsIdSchema),
  otpController.requestVerification,
)

// @route POST /otps/email-verification/check/:id
router.post(
  '/email-verification/check/:id',
  verifyAccessToken as unknown as RouteHandler,
  otpVerifyLimiter,
  handleValidation(checkVerificationSchema),
  otpController.verifyEmail,
)

// @route GET /otps/password-reset/status
router.get('/password-reset/status', verifyPasswordToken, otpController.status as RouteHandler)

// @route PATCH /password-reset
router.patch(
  '/password-reset',
  verifyPasswordToken,
  handleValidation(resetPasswordSchema),
  otpController.resetPassword as RouteHandler,
)

// @route POST /otps/resend
router.post(
  '/resend',
  otpSendLimiter,
  resendOtpFlow,
  handleValidation(resendOtpSchema),
  otpController.resendCode as unknown as RouteHandler,
)

export default router
