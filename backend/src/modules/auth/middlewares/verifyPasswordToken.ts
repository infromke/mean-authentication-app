import jwt from 'jsonwebtoken'

import type { NextFunction, Request, RequestHandler, Response } from 'express'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import type { TokenResetPayload } from '../../../shared/types/auth.types.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

/**
 * Middleware para autorizar a redefinição de senha.
 * Verifica se o cookie `passwordToken` (gerado após validar o OTP) é válido.
 */
const verifyPasswordToken: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const { passwordToken } = req.cookies

  if (!passwordToken) throw new AppError(401, ['Access denied', 'Token not found'])

  try {
    const payload = jwt.verify(passwordToken, env.JWT_RESET_SECRET) as TokenResetPayload
    res.locals.reset = { email: payload.email }
    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyPasswordToken
