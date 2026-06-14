import type { NextFunction, Request, RequestHandler, Response } from 'express'

import handleValidation from '../../../shared/middlewares/handleValidation.js'
import { paramsIdSchema } from '../../../shared/schemas/common.schema.js'
import isAccountVerified from '../../user/middlewares/isAccountVerified.js'
import verifyOwnership from '../../user/middlewares/verifyOwnership.js'

import verifyAccessToken from './verifyAccessToken.js'
import verifyResetEmailToken from './verifyResetEmailToken.js'

/**
 * Verifica se o usuário está logado e se sua conta foi verificada.
 */
const verifiedOnly = [verifyAccessToken, isAccountVerified]

/**
 * Verifica se o usuário está logado e se é dono da conta que deseja alterar.
 */
const ownerOnly = [verifyAccessToken, verifyOwnership]

/**
 * Verifica se o usuário está logado se o ID (`id`) passado é válido.
 * Também verifica se o usuário logado é dono da conta que deseja alterar e se sua conta está verificada.
 */
const fullLock = [
  verifyAccessToken,
  handleValidation(paramsIdSchema),
  verifyOwnership,
  isAccountVerified,
]

/**
 * Verifica se tipo (`type`) do otp enviado é `VERIFY` ou `RESET`.
 * Se for do tipo VERIFY, o usuário passa pelo middleware verifyAccessToken.
 * Se for do tipo RESET, o usuário passa pelo middleware verifyResetEmailToken.
 */
const resendOtpFlow: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body.type === 'VERIFY') {
    verifyAccessToken(req, res, next)
    return
  }
  verifyResetEmailToken(req, res, next)
}

export { fullLock, ownerOnly, resendOtpFlow, verifiedOnly }
