import type { Request, Response, NextFunction, RequestHandler } from 'express'
import env from '../../../config/env.js'
import jwt from 'jsonwebtoken'
import throwHttpError from '../../../shared/utils/throwHttpError.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

/**
 * Middleware para autorizar a redefinição de senha.
 * Verifica se o cookie `passwordToken` (gerado após validar o OTP) é válido.
 */
const verifyPasswordToken: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { passwordToken } = req.cookies

  if (!passwordToken) throw throwHttpError(401, isEnvDev ? 'Token not found' : 'Access denied')

  try {
    jwt.verify(passwordToken, env.JWT_RESET_SECRET)
    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyPasswordToken
