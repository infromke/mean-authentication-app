import type { Request, Response, NextFunction, RequestHandler } from 'express'
import userService from '../modules/user/user.service.js'
import throwHttpError from '../utils/throwHttpError.js'

/**
 * Restringe o acesso apenas a usuários que realizaram a verificação de conta.
 */
const isAccountVerified: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.user!

  const user = await userService.show(id)
  if (!user.isAccountVerified)
    throw throwHttpError(403, 'Account must be verified to perform this action')

  next()
}

export default isAccountVerified
