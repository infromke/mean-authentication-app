import rateLimit, {
  type RateLimitExceededEventHandler,
  type RateLimitRequestHandler,
} from 'express-rate-limit'

import AppError from '../errors/AppError.js'

/**
 * Cria uma instância configurada de rate-limit do Express.
 * @param {number} windowMin - O tempo da janela de restrição em minutos
 * @param {number} maxReq - O número máximo de requisições permitidas dentro da janela.
 * @param {string} message - A mensagem de erro personalizada a ser exibida quando o limite for excedido.
 * @returns Um middleware do express-rate-limit.
 */
const createLimiter = (
  windowMin: number,
  maxReq: number,
  message: string,
): RateLimitRequestHandler => {
  const limitHandler: RateLimitExceededEventHandler = (_req, _res, next) => {
    try {
      throw new AppError(429, message)
    } catch (error) {
      next(error)
    }
  }

  return rateLimit({
    windowMs: windowMin * 60 * 1000,
    max: maxReq,
    standardHeaders: 'draft-7', // retorna headers padronizados de acordo com a IETF
    legacyHeaders: false, // desativa os headers X-RateLimit-* antigos
    handler: limitHandler,
  })
}

export default createLimiter
