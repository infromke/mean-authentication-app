/// <reference types="./auth.types.js" />

declare namespace Express {
  interface Request {
    user?: TokenUserPayload // o objeto "user" agora existe nativamente
  }
}
