import jwt from 'jsonwebtoken'

import type { NextFunction, Request, RequestHandler, Response } from 'express'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import type { TokenUserPayload } from '../../../shared/types/auth.types.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

/**
 * Verifica a integridade de um web token json lendo-o do cookie httpOnly de acordo com o ambiente.
 */
const verifyAccessToken: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const { accessToken } = req.cookies

  if (!accessToken) throw new AppError(401, ['Access denied', 'Token not found'])

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
