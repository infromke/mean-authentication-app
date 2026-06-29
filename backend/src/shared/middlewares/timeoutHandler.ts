import type { NextFunction, Request, RequestHandler, Response } from 'express'

import AppError from '../errors/AppError.js'

/**
 * Intercepta a requisição HTTP e impõe um limite estrito de tempo para a resposta.
 * Caso o servidor não responda dentro da janela estipulada, a requisição é cancelada
 * e um erro de `Service Unavailable (503)` é repassado para a pipeline de erros.
 * @param seconds O tempo limite em segundos antes de disparar o timeout. Padrão 3.
 * @returns O middleware do Express para controle de tempo.
 */
const timeoutHandler = (seconds: number = 3): RequestHandler => {
  return (_req: Request, res: Response, next: NextFunction): void => {
    // cria um timer para disparar após o tempo limite
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        next(
          new AppError(
            503,
            'The server took too long to respond. The request was aborted to prevent resource exhaustion.',
          ),
        )
      }
    }, seconds * 1000)

    // caso a requisição termine com sucesso ou falha antes do tempo, limpa o timer para evitar vazamentos
    res.on('finish', () => clearTimeout(timer))
    res.on('close', () => clearTimeout(timer))

    next()
  }
}

export default timeoutHandler
