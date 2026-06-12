import cache from '../lib/cache.js'

/**
 * Limpa chaves de cache relacionadas a um usuário específico ou listas globais.
 * @param {string} userId - (Opcional) ID do usuário para limpar sessões/perfil.
 */
const clearUserCache = (userId: string | null = null): void => {
  const allCacheKeys = cache.keys()

  // filtra e remove chaves associadas à listagem geral de usuários (GET /users)
  const listKeys = allCacheKeys.filter((key) => key.startsWith('users_list'))
  if (listKeys.length > 0) cache.del(listKeys)

  // limpa o cache individual (GET /users/:id e GET /auth/me) se o ID for fornecido
  if (userId) {
    cache.del(`user_id_${userId}`)
    cache.del(`user_session_${userId}`)
  }
}

export default clearUserCache
