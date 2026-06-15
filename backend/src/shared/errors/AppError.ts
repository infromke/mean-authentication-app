import type { ZodIssue } from 'zod'

class AppError extends Error {
  public readonly status: number
  public readonly code?: number
  public readonly errors?: ZodIssue[] | unknown[] | unknown
  public readonly keyPattern?: Record<string, unknown>
  public data?: unknown | unknown[] // para qualquer payload extra

  constructor(
    status: number = 500,
    message: string = 'Internal Server Error',
    code?: number,
    errors?: ZodIssue[] | unknown[] | unknown,
    keyPattern?: Record<string, unknown>,
  ) {
    super(message)

    this.status = status
    this.errors = errors
    if (code) this.code = code
    if (keyPattern) this.keyPattern = keyPattern

    // garante que o JS reconheça que o AppError é filho de Error e não o próprio Error
    Object.setPrototypeOf(this, new.target.prototype)

    // gera o rastro de arquivos por onde o erro passou, desconsiderando o próprio AppError
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * Encadeia metadados adicionais à instância do erro sem poluir o construtor.
   */
  public withData(data: any): this {
    this.data = data
    return this
  }
}

export default AppError
