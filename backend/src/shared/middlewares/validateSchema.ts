import { ZodError, type ZodType } from 'zod'

import type { NextFunction, Request, RequestHandler, Response } from 'express'

import AppError from '../errors/AppError.js'

/**
 * Processa os resultados das validações do Zod.
 * Caso existam erros, interrompe a requisição e lança um erro formatado.
 */
const validateSchema =
  <T extends ZodType>(schema: T): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // captura o objeto validado e transformado pelo Zod
      const parsedData = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      }) as { body: any; query: any; params: any }

      // reinjeta os dados transformados no body
      req.body = parsedData.body

      // para query e params as propriedades são apenas mutadas em vez de substituir o objeto todo
      Object.assign(req.query, parsedData.query)
      Object.assign(req.params, parsedData.params)

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => {
          // pega o nome do campo que deu erro ou informa "body", "query" ou "param" no path[0]
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

export default validateSchema
