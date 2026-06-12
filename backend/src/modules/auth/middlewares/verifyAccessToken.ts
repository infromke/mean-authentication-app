import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { TokenUserPayload } from '../../../shared/types/auth.types.js'
import env from '../../../config/env.js'
import jwt from 'jsonwebtoken'
import AppError from '../../../shared/errors/AppError.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

/**
 * Verifica a integridade de um web token json lendo-o do cookie httpOnly de acordo com o ambiente.
 */
const verifyAccessToken: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { accessToken } = req.cookies

  if (!accessToken) throw new AppError(401, isEnvDev ? 'Token not found' : 'Access denied')

  try {
    const payload = jwt.verify(accessToken, env.JWT_ACCESS_SECRET) as TokenUserPayload

    req.user = { id: payload.id }

    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyAccessToken
