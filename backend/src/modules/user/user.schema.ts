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

/* SCHEMAS (para o Express consumir) */

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

export { registerSchema, updateSchema }
