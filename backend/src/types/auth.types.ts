import type jwt from 'jsonwebtoken'

/* INTERFACES */

// estrutura do payload que o token carrega e injeta no req.user
export interface TokenUserPayload extends jwt.JwtPayload {
  id: string
}
