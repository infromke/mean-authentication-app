import type { Request, Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../modules/session/session.controller.js'
import throwHttpError from '../utils/throwHttpError.js'

/**
 * Verifica se o usuário autenticado é o proprietário da conta passada pelo ID na URL.
 */
const verifyOwnership = (
  req: AuthenticatedRequest & Request,
  res: Response,
  next: NextFunction,
): void => {
  const authenticatedUserId = req.user.id ? req.user.id.toString() : ''

  if (req.params.id !== authenticatedUserId) {
    next(throwHttpError(403, 'You can only modify your own account'))
    return
  }
  next()
}

export default verifyOwnership
