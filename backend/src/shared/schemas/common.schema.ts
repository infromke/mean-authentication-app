import { z } from 'zod'
import mongoose from 'mongoose'

/**
 * Verifica se o `id` fornecido segue o padrão de ID auto-gerado pelo MongoDB.
 */
const idSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: 'The provided ID format is invalid',
})

/**
 * Verifica a chave `params` e valida se dentro dela existe um `id` que corresponda ao `idSchema`.
 */
const paramsIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
})

export { idSchema, paramsIdSchema }
