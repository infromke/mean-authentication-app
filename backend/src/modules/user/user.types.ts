import type z from 'zod'

import type { getAllUsersQuerySchema, registerBodySchema } from './user.schema.js'

// DTOs baseados nos schemas do Zod
type RawCreateUser = z.infer<typeof registerBodySchema> // contém a propriedade "confirmPassword"
export type CreateUserDTO = Omit<RawCreateUser, 'confirmPassword'>

export type GetAllUsersQuery = z.infer<typeof getAllUsersQuerySchema>
