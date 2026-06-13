import type jwt from 'jsonwebtoken'

/* INTERFACES */

// estrutura do payload que o token carrega e injeta no req.user
export interface TokenUserPayload extends jwt.JwtPayload {
  id: string
}

// estrutura do payload que o token carrega e injeta em res.locals
export interface TokenResetPayload extends jwt.JwtPayload {
  email: string
}
