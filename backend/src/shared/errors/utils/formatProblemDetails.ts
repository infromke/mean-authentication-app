import type { ZodIssue } from 'zod'

import env from '../../../config/env.js'
import AppError from '../AppError.js'

const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'dev'

const HTTP_ERRORS: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
}

interface RFC7807Response {
  type: string
  title: string
  status: number
  detail: string
  code?: string
  instance: string
  errors?: ZodIssue[] | unknown
  stack?: string
}

const formatProblemDetails = (err: Error | AppError, originalUrl: string) => {
  const isAppError = err instanceof AppError

  let status = isAppError ? err.status : 500
  let detail = err.message || 'An unexpected error occurred. Please try again later.'
  let code: string | undefined
  let errors: ZodIssue[] | unknown = undefined

  if (isAppError) {
    status = err.status
    errors = err.errors
    code = err.code

    // define qual mensagem será atribuída ao "detail" a partir do ambiente de execução
    if (isDev && err.debug) {
      detail = err.debug // se houver uma mensagem técnica, ela vira o detail
    } else {
      detail = err.message // senão, o detail é a mensagem pública
    }
  }

  const body: RFC7807Response = {
    type: 'about:blank',
    title: HTTP_ERRORS[status] || 'Error',
    status,
    detail,
    ...(code ? { code } : {}),
    instance: originalUrl,
    ...(errors ? { errors } : {}),
    ...(isDev ? { stack: err.stack } : {}),
  }

  return { status, body }
}

export default formatProblemDetails
