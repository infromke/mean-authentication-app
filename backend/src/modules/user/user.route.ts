import { Router } from 'express'
import userController from './user.controller.js'
import { authLimiter } from '../../middlewares/rateLimiter.js'
import handleValidation from '../../middlewares/handleValidation.js'
import { fullLock, ownerOnly } from '../../middlewares/tollPlaza.js'
import { registerSchema, updateSchema } from './user.schema.js'
import { paramsIdSchema } from '../../utils/common.schema.js'
import { isGuest } from '../../middlewares/isLoggedIn.js'

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
router.delete('/:id', fullLock, userController.destroy)

export default router
