import 'express'

import type { TokenUserPayload } from './auth.types.ts'

declare module 'express' {
  interface Request {
    user?: TokenUserPayload // o objeto "user" agora existe nativamente
  }
}
