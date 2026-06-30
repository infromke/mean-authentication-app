import { describe, expect, it } from 'vitest'

import AppError from '../errors/AppError.js'

import normalizeJwtError from './normalizeJwtError.js'

describe('normalizeJwtError', () => {
  it('should return an AppError (401) when the token has expired (TokenExpiredError)', () => {
    const expiredError = new Error('jwt expired')
    expiredError.name = 'TokenExpiredError'

    const result = normalizeJwtError(expiredError)

    expect(result).toBeInstanceOf(AppError)
    expect(result.status).toBe(401)
    expect(result.message).toBe('Session expired')
    expect(result.debug).toBe('JWT has expired')
  })

  describe('Internal configuration errors', () => {
    it('should return an AppError (500) when the algorithm is invalid', () => {
      const configError = new Error('invalid algorithm')

      const result = normalizeJwtError(configError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Internal Server Error')
      expect(result.debug).toBe('Internal JWT config error: invalid algorithm')
    })

    it('should return an AppError (500) when the secret or public key is missing', () => {
      const configError = new Error('secret or public key must be provided')

      const result = normalizeJwtError(configError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Internal Server Error')
      expect(result.debug).toBe('Internal JWT config error: secret or public key must be provided')
    })
  })

  describe('Token rejection errors', () => {
    it('should return an AppError (401) when the token is malformed or has an invalid signature (JsonWebTokenError)', () => {
      const jwtError = new Error('invalid signature')
      jwtError.name = 'JsonWebTokenError'

      const result = normalizeJwtError(jwtError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Access denied')
      expect(result.debug).toBe('JWT was rejected: invalid signature')
    })

    it('should return an AppError (401) when the token is not active yet (NotBeforeError)', () => {
      const nbfError = new Error('jwt not active')
      nbfError.name = 'NotBeforeError'

      const result = normalizeJwtError(nbfError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Access denied')
      expect(result.debug).toBe('JWT was rejected: jwt not active')
    })
  })

  describe('Fallback errors', () => {
    it('should return an AppError (401) with a generic message for unknown untracked Errors', () => {
      const genericError = new Error('A random standard error')

      const result = normalizeJwtError(genericError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Access denied')
      expect(result.debug).toBe('Unknown error while validating token')
    })

    it('should return an AppError (401) even if the thrown error is not an instance of Error', () => {
      const weirdError = 'Unexpected anything thrown instead of an Error object, like this string'

      const result = normalizeJwtError(weirdError)

      expect(result).toBeInstanceOf(AppError)
      expect(result.status).toBe(401)
      expect(result.message).toBe('Access denied')
      expect(result.debug).toBe('Unknown error while validating token')
    })
  })
})
