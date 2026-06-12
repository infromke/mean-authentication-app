import { Router } from 'express'
import userController from './user.controller.js'
import { authLimiter } from '../../shared/middlewares/rateLimiter.js'
import handleValidation from '../../shared/middlewares/handleValidation.js'
import { fullLock, ownerOnly } from '../auth/middlewares/tollPlaza.js'
import { registerSchema, updateSchema } from './user.schema.js'
import { paramsIdSchema } from '../../shared/schemas/common.schema.js'
import { isGuest } from '../auth/middlewares/isLoggedIn.js'

const router = Router()

//  --- PUBLIC ROUTES ---

// @route GET /users
router.get('/', userController.getAll)

// @route POST /users
router.post('/', authLimiter, isGuest, handleValidation(registerSchema), userController.create)

// @route GET /users/:id
router.get('/:id', handleValidation(paramsIdSchema), userController.getById)

//  --- PRIVATE ROUTES ---

// @route PATCH /users/:id
router.patch('/:id', ownerOnly, handleValidation(updateSchema), userController.update)

// @route DELETE /users/:id
router.delete('/:id', fullLock, userController.remove)

export default router
