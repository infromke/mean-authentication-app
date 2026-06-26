import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'

import env from '../../config/env.js'

import AppError from '../errors/AppError.js'
import formatProblemDetails from '../errors/utils/formatProblemDetails.js'

/**  Captura qualquer erro inesperado lançado em rotas, middlewares ou controllers.
 * Diferencia entre ambiente de produção e desenvolvimento seguindo a RFC 7807.
 */
const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'dev'

  if (isDev) {
    console.error(err.stack) // exibe a stack no terminal
  }

  // transforma o erro no padrão RFC 7807
  const { status, body } = formatProblemDetails(err, req.originalUrl)

  res.setHeader('Content-Type', 'application/problem+json') // header conforme o RFC da IETF
  return res.status(status).json(body)
}

export default errorHandler
