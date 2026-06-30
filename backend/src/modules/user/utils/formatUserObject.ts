import type { IUser, IUserPersistence } from '../user.model.js'

// IUser sem "password", mas com "id" obrigatoriamente
export type FormattedUser = Omit<IUser, 'password'> & {
  id: string
}

/**
 * Mapeia a estrutura de persistência do MongoDB para a assinatura pública da aplicação. Remove
 * dados sensíveis e padroniza o ID do usuário.
 * @param user O documento bruto ou instância do usuário originado da persistência.
 * @returns O objeto do usuário formatado contendo apenas dados públicos.
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
