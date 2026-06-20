import type { ZodIssue } from 'zod'

type ErrorMessage = string | [publicInfo: string, debugInfo: string]

/**
 * Representa uma exceção de domínio padronizada para a aplicação.
 * Permite encapsular metadados de negócio e mensagens distintas para produção e desenvolvimento.
 * @augments Error
 */
class AppError extends Error {
  public readonly status: number
  public readonly code?: string
  public readonly errors?: ZodIssue[] | unknown[] | unknown
  public readonly debug?: string
  public data?: unknown | unknown[]

  /**
   * Cria uma instância de AppError.
   * @param status O código de status HTTP correspondente ao erro (ex: 404, 409). Padrão: 500.
   * @param message Uma string direta e simples ou uma tupla contendo `[mensagemPública, detalheTécnico]`.
   * @param code Um identificador textual único para categorização do erro no front-end (ex: "EMAIL_ALREADY_IN_USE"). Pode ser completamente ignorado.
   * @param errors Uma lista de problemas de validação, geralmente do Zod.
   */
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
   * Encadeia metadados ou payloads adicionais à instância do erro sem a necessidade de poluir o construtor.
   * Útil para transferir estados temporários como tokens de recuperação ou dados de contexto.
   * @param data O payload de dados estruturados que será anexado ao erro.
   * @returns A própria instância do AppError modificada para permitir encadeamento de métodos.
   */
  public withData(data: unknown | unknown[]): this {
    this.data = data
    return this
  }
}

export default AppError
