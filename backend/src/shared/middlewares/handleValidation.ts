import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodError, type ZodType } from 'zod'
import AppError from '../errors/AppError.js'

/**
 * Processa os resultados das validações do Zod.
 * Caso existam erros, interrompe a requisição e lança um erro formatado.
 */
const handleValidation =
  (schema: ZodType): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => {
          // pega o nome do campo que deu erro
          const pathKey = issue.path.length > 1 ? issue.path[1] : issue.path[0]

          return {
            field: pathKey !== undefined ? pathKey?.toString() : 'field',
            error: issue.message,
          }
        })
        throw new AppError(400, 'Your request has invalid fields', undefined, formattedErrors)
      }

      next(error) // repassa outros erros
    }
  }

export default handleValidation
