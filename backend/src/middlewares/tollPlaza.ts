import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../modules/session/session.controller.js'
import verifyAccessToken from './verifyAccessToken.js'
import isAccountVerified from './isAccountVerified.js'
import verifyOwnership from './verifyOwnership.js'
import handleValidation from './handleValidation.js'
import { paramsIdSchema } from '../utils/common.schema.js'

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
 * Se for do tipo RESET, o validator verifica e valida o `email` passado.
 */
const resendOtpFlow = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body.type === 'VERIFY') {
    verifyAccessToken(req as AuthenticatedRequest & Request, res, next)
    return
  }
  next()
}

export { verifiedOnly, ownerOnly, fullLock, resendOtpFlow }
