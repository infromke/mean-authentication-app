import type { NextFunction, Request, RequestHandler, Response } from 'express'
import AppError from '../../../shared/errors/AppError.js'

/**
 * Impede que usuários já autenticados acessem a rota POST `/auth/login`.
 */
const isAuthenticated: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (req.cookies.accessToken) throw new AppError(400, 'You are already logged in')
  next()
}

/**
 * Impede que usuários já autenticados acessem as rotas de POST `/users` e `/otps/password-reset/request`.
 */
const isGuest: RequestHandler = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.cookies.accessToken) throw new AppError(403, 'Cannot proceed while logged in')
  next()
}

export { isAuthenticated, isGuest }
