import handleValidation from '../../../shared/middlewares/handleValidation.js'
import { paramsIdSchema } from '../../../shared/schemas/common.schema.js'
import isAccountVerified from '../../user/middlewares/isAccountVerified.js'
import verifyOwnership from '../../user/middlewares/verifyOwnership.js'

import verifyAccessToken from './verifyAccessToken.js'

/**
 * Verifica se o usuário está logado e se é o titular da conta que deseja alterar.
 */
const ownerOnly = [verifyAccessToken, verifyOwnership]

/**
 * Verifica se o usuário (i) está logado, (ii) forneceu um `id` válido, (iii) é o
 * titular da conta que deseja alterar e (iv) possui e-mail verificado.
 */
const fullLock = [
  verifyAccessToken,
  handleValidation(paramsIdSchema),
  verifyOwnership,
  isAccountVerified,
]

export { fullLock, ownerOnly }
