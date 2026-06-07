import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import env from '../config/env.js'

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

// interface para capturar propriedades específicas do Mongoose e do Zod
interface CustomError extends Error {
  status?: number
  code?: number
  keyPattern?: Record<string, unknown>
  errors?: unknown // para o array de validações do Zod
}

/**  Captura qualquer erro inesperado lançado em rotas, middlewares ou controllers.
 * Diferencia entre ambiente de produção e desenvolvimento seguindo a RFC 7807.
 */
const errorHandler: ErrorRequestHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  let status = err.status || 500
  let detail = err.message || 'An unexpected error occurred. Please try again later.'

  //  tratamento para o erro de duplicidade gerado pelo mongodb/mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field' // pega o nome do campo repetido
    status = 409
    detail = `The provided ${field} is already in use or active.`
  }

  //  busca o nome do erro ou simplesmente usa 'Error'
  const title = HTTP_ERROR[status] || 'Error'

  //  log de erro no console
  if (env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  // header adequado conforme o RFC da IETF (Problem Details)
  res.setHeader('Content-Type', 'application/problem+json')

  return res.status(status).json({
    type: 'about:blank', // valor padrão da RFC quando não há link de doc
    title,
    status,
    detail,
    instance: req.originalUrl,
    // extensões personalizadas abaixo
    ...(err.errors ? { errors: err.errors } : {}), // para os erros vindos do Zod
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  })
}

export default errorHandler
