import jwt, { type SignOptions } from 'jsonwebtoken'

/**
 * Gera um token JWT.
 * @param user Objeto contendo dados do usuário, como `id`, `role` ou `email`.
 * @param secret Chave secreta utilizada para assinar o token. Deve sem uma string longa e aleatória.
 * @param expirationTime Tempo de expiração do token expresso em segundos ou uma string descrevendo um intervalo de tempo. Ex.: '120ms', '10h', '2d' ou apenas um número.
 * @returns Token JSON para o usuário especificado.
 */
const generateToken = (
  user: Record<string, string>,
  secret: string,
  expirationTime: NonNullable<SignOptions['expiresIn']>,
): string => {
  return jwt.sign(user, secret, { expiresIn: expirationTime })
}

export default generateToken
