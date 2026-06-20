import AppError from '../errors/AppError.js'

/**
 * Normaliza erros disparados pela biblioteca jsonwebtoken, adicionando status HTTP
 * e mensagens semânticas baseadas no ambiente.
 */
const normalizeJwtError = (error: unknown): AppError => {
  // se já for uma instância de Error (que o jsonwebtoken lança)
  if (error instanceof Error) {
    if (error.name === 'TokenExpiredError') {
      return new AppError(403, ['Access denied', 'Token has expired'])
    }
  }

  // padrão para outros erros
  return new AppError(401, ['Access denied', 'Unknown error while validating token'])
}

export default normalizeJwtError
