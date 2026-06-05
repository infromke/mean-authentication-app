import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import throwHttpError from '../utils/throwHttpError.js'
import normalizeJwtError from '../utils/normalizeJwtError.js'

const isEnvDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'

/**
 * Middleware para autorizar a redefinição de senha.
 * Verifica se o cookie `passwordToken` (gerado após validar o OTP) é válido.
 */
const verifyPasswordToken = (req: Request, _res: Response, next: NextFunction): void => {
  const { passwordToken } = req.cookies

  if (!passwordToken) throw throwHttpError(401, isEnvDev ? 'Token not found' : 'Access denied')

  try {
    jwt.verify(passwordToken, process.env.JWT_RESET_SECRET as string)
    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyPasswordToken
