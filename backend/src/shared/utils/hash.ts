import bcrypt from 'bcrypt'

import env from '../../config/env.js'

/**
 * Gera o hash criptográfico de uma senha de forma assíncrona.
 * @param password A senha em texto limpo fornecida pelo usuário.
 * @returns A string do hash criptografado gerado.
 */
const generatePassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS)
  return await bcrypt.hash(password, salt)
}

/**
 * Compara uma senha em texto limpo com um hash armazenado para verificar a correspondência.
 * @param plainPassword A senha em texto limpo enviada na requisição atual.
 * @param hashedPassword O hash da senha recuperado do banco de dados.
 * @returns True se as senhas coincidirem, caso contrário false.
 */
const validatePassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> =>
  await bcrypt.compare(plainPassword, hashedPassword)

export { generatePassword, validatePassword }
