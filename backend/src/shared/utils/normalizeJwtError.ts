import env from '../../config/env.js'

import AppError from '../errors/AppError.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

/**
 * Normaliza erros disparados pela biblioteca jsonwebtoken, adicionando status HTTP
 * e mensagens semânticas baseadas no ambiente.
 */
const normalizeJwtError = (error: unknown): AppError => {
  let status = 401
  let message = 'Access denied'

  // se já for uma instância de Error (que o jsonwebtoken lança)
  if (error instanceof Error) {
    if (isEnvDev) {
      message = 'Invalid token'

      if (error.name === 'TokenExpiredError') {
        status = 403
        message = 'Token has expired'
      }
    } else {
      if (error.name === 'TokenExpiredError') {
        status = 403
        message = 'Session expired'
      }
    }

    return new AppError(status, message)
  }

  // padrão para erros que não são instância de Error
  return new AppError(401, isEnvDev ? 'Unknown error while validating token' : 'Access denied')
}

export default normalizeJwtError
