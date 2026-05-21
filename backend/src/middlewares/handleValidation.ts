import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ZodError, type ZodType } from 'zod'
import throwHttpError from '../utils/throwHttpError.js'

/**
 * Processa os resultados das validações do Zod.
 * Caso existam erros, interrompe a requisição e lança um erro formatado.
 */
const handleValidation =
  (schema: ZodType): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
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
        next(throwHttpError(400, 'Your request has invalid fields', formattedErrors))
        return
      }

      next(error) // repassa outros erros
    }
  }

export default handleValidation
