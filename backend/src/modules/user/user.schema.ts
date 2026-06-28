import { z } from 'zod'

import { idSchema } from '../../shared/schemas/common.schema.js'

/* REGRAS de base (compartilhadas entre register e update) */

const userBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(56, 'Name must be between 2 and 56 characters'),
  email: z.email({ error: 'Provide a valid e-mail address' }).trim().toLowerCase(), // alternativa ao normalizeEmail()
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

/* ESTRUTURAS ISOLADAS (para o z.infer) */

export const registerBodySchema = userBody
  .extend({
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords must match each other',
    path: ['confirmPassword'], // erro associado ao campo confirmPassword
  })

export const getAllUsersQuerySchema = z.object({
  // apenas aceita uma string opcional para a busca textual (nome/e-mail)
  search: z
    .string()
    .optional()
    .transform((val) => val?.trim()),

  // converte a string "true"/"false" diretamente para booleano ou marca como "undefined"
  verified: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true
      if (val === 'false') return false
      return undefined
    }),

  // se não for enviado, assume "0". Depois transforma e valida como número positivo.
  page: z
    .string()
    .default('0')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 0, { error: 'Page must be a non-negative number' }),

  // se não for enviado, assume "10". Depois transforma e limita o tamanho máximo em 50.
  size: z
    .string()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val >= 1 && val <= 50, {
      error: 'Size must be between 1 and 50',
    }),

  // trata a ordenação dinâmica com "createdAt,desc" como fallback
  sort: z
    .string()
    .default('createdAt,desc')
    .transform((val) => {
      const [rawField, rawDirection] = val.split(',')

      const allowedFields = ['name', 'email', 'createdAt']
      const finalField = rawField && allowedFields.includes(rawField) ? rawField : 'createdAt'
      const finalDirection = rawDirection === 'asc' ? 'asc' : 'desc'

      return { field: finalField, direction: finalDirection }
    }),
})

/* SCHEMAS (para o Express consumir) */

// GET /users
const getAllUsersSchema = z.object({
  query: getAllUsersQuerySchema,
})

// POST /users
const registerSchema = z.object({
  body: registerBodySchema,
})

// PATCH /users/:id
const updateSchema = z.object({
  params: z.object({
    id: idSchema, // valida o ID na URL
  }),
  body: userBody
    .partial() // campos viram opcionais
    .extend({
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.password && data.password !== data.confirmPassword) {
          return false
        }
        return true
      },
      {
        error: 'Passwords must match each other',
        path: ['confirmPassword'],
      },
    ),
})

export { getAllUsersSchema, registerSchema, updateSchema }
