import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { AuthenticatedRequest } from '../modules/session/session.controller.js'
import verifyAccessToken from './verifyAccessToken.js'
import isAccountVerified from './isAccountVerified.js'
import verifyOwnership from './verifyOwnership.js'
import handleValidation from './handleValidation.js'
import { paramsIdSchema } from '../utils/common.schema.js'

/* eslint-disable @typescript-eslint/no-explicit-any */
// tipo de Request customizável onde "user" (req.user) pode ou não estar presente
type RouteHandler = RequestHandler<
  any, // Params
  any, // ResBody
  any, // ReqBody
  any, // ReqQuery
  Record<string, unknown> // ResLocals
>

/**
 * Verifica se o usuário está logado e se sua conta foi verificada.
 */
const verifiedOnly: RouteHandler[] = [
  verifyAccessToken as unknown as RouteHandler,
  isAccountVerified as unknown as RouteHandler,
]

/**
 * Verifica se o usuário está logado e se é dono da conta que deseja alterar.
 */
const ownerOnly: RouteHandler[] = [
  verifyAccessToken as unknown as RouteHandler,
  verifyOwnership as unknown as RouteHandler,
]

/**
 * Verifica se o usuário está logado se o ID (`id`) passado é válido.
 * Também verifica se o usuário logado é dono da conta que deseja alterar e se sua conta está verificada.
 */
const fullLock: RouteHandler[] = [
  verifyAccessToken as unknown as RouteHandler,
  handleValidation(paramsIdSchema) as unknown as RouteHandler,
  verifyOwnership as unknown as RouteHandler,
  isAccountVerified as unknown as RouteHandler,
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
