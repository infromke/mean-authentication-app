import { Router } from 'express'
import { globalLimiter } from '../shared/middlewares/rateLimiter.js'
import AuthRouter from './auth/auth.route.js'
import OtpRouter from './otp/otp.route.js'
import UserRouter from './user/user.route.js'

const router = Router()

router.use(globalLimiter)
router.use('/users', UserRouter)
router.use('/auth', AuthRouter)
router.use('/otps', OtpRouter)

export default router
