import type { Request, Response, NextFunction } from 'express'
import throwHttpError from '../utils/throwHttpError.js'

/**
 * Impede que usuários já autenticados acessem a rota POST `/sessions/login`.
 */
const isAuthenticated = (req: Request, res: Response, next: NextFunction): void => {
  if (req.cookies.accessToken) throw throwHttpError(400, 'You are already logged in')
  next()
}

/**
 * Impede que usuários já autenticados acessem as rotas de POST `/users` e `/otps/password-reset/request`.
 */
const isGuest = (req: Request, res: Response, next: NextFunction): void => {
  if (req.cookies.accessToken) throw throwHttpError(403, 'Cannot proceed while logged in')
  next()
}

export { isAuthenticated, isGuest }
