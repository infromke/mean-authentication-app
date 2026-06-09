import { Router } from 'express'
import { globalLimiter } from '../shared/middlewares/rateLimiter.js'
import UserRouter from './user/user.route.js'
import SessionRouter from './auth/auth.route.js'
import OtpRouter from './otp/otp.route.js'

const router = Router()

router.use(globalLimiter)
router.use('/users', UserRouter)
router.use('/sessions', SessionRouter)
router.use('/otps', OtpRouter)

export default router
