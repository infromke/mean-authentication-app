import type { Request, Response, NextFunction, RequestHandler } from 'express'
import userService from '../user.service.js'
import AppError from '../../../shared/errors/AppError.js'

/**
 * Restringe o acesso apenas a usuários que realizaram a verificação de conta.
 */
const isAccountVerified: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.user!

  const user = await userService.findById(id)
  if (!user.isAccountVerified)
    throw new AppError(403, 'Account must be verified to perform this action')

  next()
}

export default isAccountVerified
