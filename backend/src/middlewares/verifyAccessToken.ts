import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../modules/session/session.controller.js'
import jwt from 'jsonwebtoken'
import throwHttpError from '../utils/throwHttpError.js'

const isEnvDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'

// interface para os dados do usuário advém do token
interface UserPayload extends jwt.JwtPayload {
  id?: string
}

/**
 * Verifica a integridade de um web token json lendo-o do cookie httpOnly de acordo com o ambiente.
 */
const verifyAccessToken = (
  req: AuthenticatedRequest & Request,
  res: Response,
  next: NextFunction,
): void => {
  const { accessToken } = req.cookies

  if (!accessToken) {
    throwHttpError(401, isEnvDev ? 'Token not found' : 'Access denied')
  }

  try {
    const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET as string) as UserPayload
    req.user = { ...req.user, ...payload }

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

export default verifyAccessToken
