import type { NextFunction, Request, RequestHandler, Response } from 'express'

import AppError from '../../../shared/errors/AppError.js'

/**
 * Verifica se o usuário autenticado é o proprietário da conta passada pelo ID na URL.
 */
const verifyOwnership: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authenticatedUserId = req.user!.id ? req.user!.id.toString() : ''

  if (req.params.id !== authenticatedUserId)
    throw new AppError(403, 'You can only modify your own account')

  next()
}

export default verifyOwnership
