import bcrypt from 'bcrypt'

/**
 * Gera uma senha de forma assíncrona.
 * @param {string} password - Senha fornecida.
 * @returns {promise} Senha hasheada.
 */
const generatePassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  const hash = await bcrypt.hash(password, salt)
  return hash
}

/**
 * Compara senhas de forma assíncrona.
 * @param {string} givenPwd - Senha fornecida.
 * @param {string} storedPwd - Senha armazenada no banco de dados.
 * @returns {promise} true se as senhas coincidirem, caso contrário false.
 */
const validatePassword = async (givenPwd: string, storedPwd: string): Promise<boolean> =>
  await bcrypt.compare(givenPwd, storedPwd)

export { generatePassword, validatePassword }
