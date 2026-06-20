import type { ZodIssue } from 'zod'

type ErrorMessage = string | [publicInfo: string, debugInfo: string]

class AppError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly errors?: ZodIssue[] | unknown[] | unknown
  public readonly debug?: string
  public data?: unknown | unknown[] // para qualquer payload extra

  constructor(
    status: number = 500,
    message: ErrorMessage = 'Internal Server Error',
    code?: string,
    errors?: ZodIssue[] | unknown[] | unknown,
  ) {
    const isArray = Array.isArray(message)
    super(isArray ? message[0] : message)

    this.status = status
    this.errors = errors
    if (isArray && message[1]) this.debug = message[1]
    if (code) this.code = code

    // garante que o JS reconheça que o AppError é filho de Error e não o próprio Error
    Object.setPrototypeOf(this, new.target.prototype)

    // gera o rastro de arquivos por onde o erro passou, desconsiderando o próprio AppError
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Encadeia metadados adicionais à instância do erro sem poluir o construtor.
   */
  public withData(data: unknown | unknown[]): this {
    this.data = data
    return this
  }
}

export default AppError
