import jwt, { type SignOptions } from 'jsonwebtoken'

/**
 * Gera um token JWT.
 * @param {object} user - Objeto contendo dados do usuário, como `id`, `role` ou `email`.
 * @param {string} secret - Chave secreta utilizada para assinar o token. Deve sem uma string longa e aleatória.
 * @param {string | number} expirationTime - Tempo de expiração do token expresso em segundos ou uma string descrevendo um intervalo de tempo. Ex.: '120ms', '10h', '2d' ou apenas um número.
 * @returns {string} Token JSON para o usuário especificado.
 */
const generateToken = (
  user: Record<string, any>,
  secret: string,
  expirationTime: NonNullable<SignOptions['expiresIn']>,
): string => {
  return jwt.sign(user, secret, { expiresIn: expirationTime })
}

export default generateToken
