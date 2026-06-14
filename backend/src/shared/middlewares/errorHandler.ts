import type { ErrorRequestHandler, NextFunction, Request, Response } from 'express'
import env from '../../config/env.js'
import AppError from '../errors/AppError.js'

// mapeamento dos status HTTP de erros esperados
const HTTP_ERROR: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
}

/**  Captura qualquer erro inesperado lançado em rotas, middlewares ou controllers.
 * Diferencia entre ambiente de produção e desenvolvimento seguindo a RFC 7807.
 */
const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  const isAppError = err instanceof AppError

  let status = isAppError ? err.status : 500
  let detail = err.message || 'An unexpected error occurred. Please try again later.'

  //  tratamento para o erro de duplicidade gerado pelo mongodb/mongoose
  if ('code' in err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field' // pega o nome do campo repetido
    status = 409
    detail = `The provided ${field} is already in use or active.`
  }

  //  log de erro no console
  if (env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  // header adequado conforme o RFC da IETF (Problem Details)
  res.setHeader('Content-Type', 'application/problem+json')

  return res.status(status).json({
    type: 'about:blank', // valor padrão da RFC quando não há link de doc
    title: HTTP_ERROR[status] || 'Error', //  busca o nome do erro ou simplesmente usa 'Error'
    status,
    detail,
    instance: req.originalUrl,
    ...(isAppError && 'errors' in err && err.errors ? { errors: err.errors } : {}), // erros do Zod
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

export default errorHandler
