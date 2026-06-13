import { Router } from 'express'
import otpController from './otp.controller.js'
import verifyAccessToken from '../auth/middlewares/verifyAccessToken.js'
import verifyResetEmailToken from '../auth/middlewares/verifyResetEmailToken.js'
import verifyPasswordToken from '../auth/middlewares/verifyPasswordToken.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import { paramsIdSchema } from '../../shared/schemas/common.schema.js'
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

//  --- PUBLIC ROUTES ---

// @route POST /otps/password-reset/request
router.post(
  '/password-reset/request',
  isGuest,
  handleValidation(requestResetSchema),
  otpController.requestPasswordReset,
)

//  --- PRIVATE ROUTES ---

// @route POST /otps/email-verification/:id
router.post(
  '/email-verification/:id',
  verifyAccessToken,
  handleValidation(paramsIdSchema),
  otpController.requestEmailVerification,
)

// @route POST /otps/email-verification/check/:id
router.post(
  '/email-verification/check/:id',
  verifyAccessToken,
  otpVerifyLimiter,
  handleValidation(checkVerificationSchema),
  otpController.verifyEmailAccount,
)

// @route GET /otps/password-reset/status
router.get('/password-reset/status', verifyPasswordToken, otpController.checkResetSession)

// @route POST /otps/password-reset/check
router.post(
  '/password-reset/check/',
  otpVerifyLimiter,
  verifyResetEmailToken,
  handleValidation(checkResetSchema),
  otpController.verifyPasswordResetCode,
)

// @route PATCH /password-reset
router.patch(
  '/password-reset',
  verifyPasswordToken,
  handleValidation(resetPasswordSchema),
  otpController.resetPassword,
)

// @route POST /otps/resend
router.post(
  '/resend',
  otpSendLimiter,
  resendOtpFlow,
  handleValidation(resendOtpSchema),
  otpController.resendOtpCode,
)

export default router
