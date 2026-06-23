import type { ZodIssue } from 'zod'

import env from '../../../config/env.js'
import AppError from '../AppError.js'

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

/**
 * Transforma uma exceção capturada em uma estrutura de resposta padronizada em conformidade estrita
 * com a RFC 7807 (Problem Details). Modifica dinamicamente o campo `detail` e anexa metadados
 * adicionais como a `stack` trace se o ambiente de execução atual for "development".
 * @param err O erro original capturado no pipeline da aplicação.
 * @param originalUrl O endpoint HTTP (`req.originalUrl`) onde a exceção ocorreu, mapeado para a propriedade `instance`.
 * @returns Um objeto contendo o status HTTP final e o corpo da resposta estruturado de acordo com a RFC 7807.
 */
const formatProblemDetails = (err: Error | AppError, originalUrl: string) => {
  const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'dev'
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
