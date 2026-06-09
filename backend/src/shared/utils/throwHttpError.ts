import type { AppError } from '../types/error.types.js'

/**
 * Cria um objeto Error com um status HTTP personalizado. Também lança o erro.
 * @param {number} status - O código de status HTTP a ser retornado.
 * @param {string} message - A mensagem de erro. Mapeia para `detail` na RFC.
 * @param {Array} errors - (Opcional) Array de erros formatados do Zod.
 */
const throwHttpError = (status: number, message: string, errors?: unknown[]): never => {
  const error = new Error(message) as AppError
  error.status = status
  if (errors) error.errors = errors // para o array de erros do Zod
  throw error
}

export default throwHttpError
