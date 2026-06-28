import { Router } from 'express'

import { authLimiter } from '../../shared/middlewares/rateLimiter.js'
import validateSchema from '../../shared/middlewares/validateSchema.js'
import { paramsIdSchema } from '../../shared/schemas/common.schema.js'

import { isGuest } from '../auth/middlewares/isLoggedIn.js'
import { fullLock, ownerOnly } from '../auth/middlewares/tollPlaza.js'

import userController from './user.controller.js'
import { getAllUsersSchema, registerSchema, updateSchema } from './user.schema.js'

const router = Router()

/**
 * -----------------------------------------------------------------------------
 * PUBLIC ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   GET /users
 * @desc    Recupera a lista paginada de todos os usuários cadastrados.
 * @access  Público
 */
router.get('/', validateSchema(getAllUsersSchema), userController.getAll)

/**
 * @route   POST /users
 * @desc    Cria uma nova conta de usuário no sistema.
 * @access  Público (Apenas convidados / Protegido por Rate Limiter)
 */
router.post('/', authLimiter, isGuest, validateSchema(registerSchema), userController.create)

/**
 * @route   GET /users/:id
 * @desc    Busca os detalhes públicos de um usuário específico através do ID.
 * @access  Público
 */
router.get('/:id', validateSchema(paramsIdSchema), userController.getById)

/**
 * -----------------------------------------------------------------------------
 * PRIVATE ROUTES
 * -----------------------------------------------------------------------------
 */

/**
 * @route   PATCH /users/:id
 * @desc    Atualiza os dados cadastrais do perfil do usuário.
 * @access  Privado (Apenas o próprio dono da conta)
 */
router.patch('/:id', ...ownerOnly, validateSchema(updateSchema), userController.update)

/**
 * @route   DELETE /users/:id
 * @desc    Remove permanentemente a conta de um usuário do sistema.
 * @access  Privado (Requer titularidade sobre a conta e e-mail verificado)
 */
router.delete('/:id', ...fullLock, userController.remove)

export default router
