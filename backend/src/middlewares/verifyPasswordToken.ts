import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import throwHttpError from '../utils/throwHttpError.js'

const isEnvDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'

/**
 * Middleware para autorizar a redefinição de senha.
 * Verifica se o cookie "passwordToken" (gerado após validar o OTP) é válido.
 */
const verifyPasswordToken = (req: Request, res: Response, next: NextFunction): void => {
  const { passwordToken } = req.cookies

  if (!passwordToken) {
    throwHttpError(401, isEnvDev ? 'Token not found' : 'Access denied')
  }

  try {
    jwt.verify(passwordToken, process.env.JWT_RESET_SECRET as string)
    next()
  } catch (error: any) {
    // personalizando outros erros para serem estritamente 401 (Unauthorized)
    error.status = 401

    if (error.name === 'TokenExpiredError') {
      error.status = 403
      error.message = isEnvDev ? 'Token has expired' : 'Session expired'
    } else {
      error.message = isEnvDev ? 'Invalid token' : 'Access denied'
    }

    next(error)
  }
}

export default verifyPasswordToken
