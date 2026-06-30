import type { NextFunction, Request, RequestHandler, Response } from 'express'

import AppError from '../../../shared/errors/AppError.js'
import userService from '../../user/user.service.js'

/**
 * Restringe o acesso apenas a usuários que realizaram a verificação de conta.
 * @throws {AppError} Lança um erro `403 Forbidden` se a conta do usuário ainda não tiver sido verificada.
 */
const isAccountVerified: RequestHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  const { id } = req.user!

  const user = await userService.getSummaryById(id)
  if (!user.isAccountVerified)
    throw new AppError(403, 'Account must be verified to perform this action')

  next()
}

export default isAccountVerified
