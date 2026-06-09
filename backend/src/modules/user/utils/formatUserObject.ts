import type { IUser, IUserPersistence } from '../user.model.js'

// IUser sem "password", mas com "id" obrigatoriamente
type FormattedUser = Omit<IUser, 'password'> & {
  id: string
}

/**
 * Filtra e formata os dados do objeto `user`.
 * @param {Object} user - Instância ou objeto bruto do usuário vindo da persistência do MongoDB.
 * @returns {Object} Dados públicos e formatados do usuário.
 */
const formatUserObject = (user: IUserPersistence): FormattedUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  isAccountVerified: user.isAccountVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

export default formatUserObject
