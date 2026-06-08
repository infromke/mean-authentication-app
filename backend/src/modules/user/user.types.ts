import type z from 'zod'
import type { registerBodySchema } from './user.schema.js'

// DTOs baseados nos schemas do Zod
type RawCreateUser = z.infer<typeof registerBodySchema> // contém a propriedade "confirmPassword"
export type CreateUserDTO = Omit<RawCreateUser, 'confirmPassword'>
