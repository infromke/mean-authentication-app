import NodeCache from 'node-cache'

/**
 * Instância do cache na memória.
 * `stdTTL` é o tempo padrão de vida (5 minutos) e
 * `checkperiod` é o tempo de varredura para deletar itens expirados (2 minutos).
 */
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 })

export default cache
