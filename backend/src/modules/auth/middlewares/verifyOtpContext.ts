import type { NextFunction, Request, RequestHandler, Response } from 'express'

import verifyAccessToken from './verifyAccessToken.js'
import verifyResetEmailToken from './verifyResetEmailToken.js'

/**
 * Roteia a verificação do token baseado no tipo do OTP ("VERIFY" ou "RESET").
 */
const verifyOtpContext: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const strategy = req.body.type === 'VERIFY' ? verifyAccessToken : verifyResetEmailToken
  return strategy(req, res, next)
}

export default verifyOtpContext
