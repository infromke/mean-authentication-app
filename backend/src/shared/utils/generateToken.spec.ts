import jwt from 'jsonwebtoken'
import { describe, expect, it, vi } from 'vitest'

import generateToken from './generateToken.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}))

describe('jsonwebtoken generation', () => {
  describe('generateToken', () => {
    it('should successfully generate a jsonwebtoken using an object and a secret key', () => {
      vi.mocked(jwt.sign).mockReturnValue('header.payload.signature' as never)

      const payload = { property: 'value' }
      const secretKey = 'secret'
      const expirationTime = '5m'

      const token = generateToken(payload, secretKey, expirationTime)

      expect(jwt.sign).toHaveBeenCalledWith(payload, secretKey, { expiresIn: expirationTime })
      expect(token).toBe('header.payload.signature')
    })
  })
})
