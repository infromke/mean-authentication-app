import { ZodError, type ZodType } from 'zod'

import type { NextFunction, Request, RequestHandler, Response } from 'express'

import AppError from '../errors/AppError.js'

/**
 * Processa os resultados das validações do Zod.
 * Caso existam erros, interrompe a requisição e lança um erro formatado.
 * @param schema O esquema do Zod que dita as regras de validação do formato e dados.
 * @throws {AppError} Lança um erro `400 Bad Request` se o corpo, query ou parâmetros possuírem campos inválidos.
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

      // para query e params as propriedades são redefinidas
      if (parsedData.query) {
        Object.defineProperty(req, 'query', {
          value: parsedData.query,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }

      if (parsedData.params) {
        Object.defineProperty(req, 'params', {
          value: parsedData.params,
          writable: true,
          configurable: true,
          enumerable: true,
        })
      }

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
