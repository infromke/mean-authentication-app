import type { NextFunction, Request, RequestHandler, Response } from 'express'
import jwt from 'jsonwebtoken'
import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import type { TokenResetPayload } from '../../../shared/types/auth.types.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

/**
 * Middleware para gerenciar o fluxo de redefinição de senha.
 * Verifica se o cookie `resetEmailToken` (gerado após o usuário fornecer seu e-mail) é válido.
 */
const verifyResetEmailToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { resetEmailToken } = req.cookies

  if (!resetEmailToken) throw new AppError(401, isEnvDev ? 'Token not found' : 'Access denied')

  try {
    const payload = jwt.verify(resetEmailToken, env.JWT_RESET_SECRET) as TokenResetPayload
    res.locals.reset = { email: payload.email }
    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyResetEmailToken
