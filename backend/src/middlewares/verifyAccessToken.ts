import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { TokenUserPayload } from '../types/auth.types.js'
import jwt from 'jsonwebtoken'
import throwHttpError from '../utils/throwHttpError.js'
import normalizeJwtError from '../utils/normalizeJwtError.js'

const isEnvDev = process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'development'

/**
 * Verifica a integridade de um web token json lendo-o do cookie httpOnly de acordo com o ambiente.
 */
const verifyAccessToken: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { accessToken } = req.cookies

  if (!accessToken) throw throwHttpError(401, isEnvDev ? 'Token not found' : 'Access denied')

  try {
    const payload = jwt.verify(
      accessToken,
      process.env.JWT_ACCESS_SECRET as string,
    ) as TokenUserPayload

    req.user = { id: payload.id }

    next()
  } catch (error: unknown) {
    const formattedError = normalizeJwtError(error)
    next(formattedError)
  }
}

export default verifyAccessToken
