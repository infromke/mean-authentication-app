import AppError from '../errors/AppError.js'

/**
 * Normaliza erros disparados pela biblioteca jsonwebtoken, adicionando status HTTP
 * e mensagens semânticas baseadas no ambiente.
 * @param error O erro capturado na interceptação ou validação do token JWT.
 * @returns Uma nova instância mapeada de AppError pronta para ser lançada.
 */
const normalizeJwtError = (error: unknown): AppError => {
  // se já for uma instância de Error (que o jsonwebtoken lança)
  if (error instanceof Error) {
    if (error.name === 'TokenExpiredError') {
      return new AppError(401, ['Session expired', 'JWT has expired'])
    }

    // erros de configuração interna
    if (
      error.message === 'invalid algorithm' ||
      error.message === 'secret or public key must be provided'
    ) {
      return new AppError(500, [
        'Internal Server Error',
        `Internal JWT config error: ${error.message}`,
      ])
    }

    // outros erros (malformed, invalid signature, claims inválidas)
    if (error.name === 'JsonWebTokenError' || error.name === 'NotBeforeError') {
      return new AppError(401, ['Access denied', `JWT was rejected: ${error.message}`])
    }
  }

  // padrão para outros erros
  return new AppError(401, ['Access denied', 'Unknown error while validating token'])
}

export default normalizeJwtError
