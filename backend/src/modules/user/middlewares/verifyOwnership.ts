import type { Request, Response, NextFunction, RequestHandler } from 'express'
import throwHttpError from '../../../shared/utils/throwHttpError.js'

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
    throw throwHttpError(403, 'You can only modify your own account')

  next()
}

export default verifyOwnership
