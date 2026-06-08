import type { ZodIssue } from 'zod'

// para qualquer erro tratado na API. As propriedades de HTTP, Mongoose e Zod são opcionais
export interface AppError extends Error {
  status?: number
  code?: number
  keyPattern?: Record<string, unknown>
  errors?: ZodIssue[] | unknown[] | unknown
}
