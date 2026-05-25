import { z } from 'zod'

const loginSchema = z.object({
  body: z.object({
    email: z
      .email({ error: 'Provide a valid e-mail address' })
      .trim()
      .toLowerCase()
      .min(1, 'Email cannot be empty'),

    password: z.string({ error: 'Password is required' }).min(1, 'Password cannot be empty'),
  }),
})

export default loginSchema
