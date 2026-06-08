import env from '../config/env.js'
import type { AppError } from '../types/error.types.js'

const isEnvDev = env.NODE_ENV === 'dev' || env.NODE_ENV === 'development'

/**
 * Normaliza erros disparados pela biblioteca jsonwebtoken, adicionando status HTTP
 * e mensagens semânticas baseadas no ambiente.
 */
const normalizeJwtError = (error: unknown): AppError => {
  // se já for uma instância de Error (que o jsonwebtoken lança)
  if (error instanceof Error) {
    const jwtError = error as AppError

    // config generalizada
    jwtError.status = 401
    jwtError.message = isEnvDev ? 'Invalid token' : 'Access denied'

    // específica para o erro de validade
    if (error.name === 'TokenExpiredError') {
      jwtError.status = 403
      jwtError.message = isEnvDev ? 'Token has expired' : 'Session expired'
    }

    return jwtError
  }

  // padrão para erros que não são instância de Error
  return {
    name: 'UnknownJwtError',
    message: isEnvDev ? 'Unknown error while validating token' : 'Access denied',
    status: 401,
  }
}

export default normalizeJwtError
