import bcrypt from 'bcrypt'
import { describe, expect, it, vi } from 'vitest'

import { generatePassword, validatePassword } from './hash.js'

vi.mock('bcrypt', () => ({
  default: {
    genSalt: vi.fn(),
    hash: vi.fn(),
    compare: vi.fn(),
  },
}))

describe('hash utils', () => {
  describe('generatePassword', () => {
    it('should successfully generate a password hash using a salt', async () => {
      vi.mocked(bcrypt.genSalt).mockResolvedValue('salt_rounds' as never)
      vi.mocked(bcrypt.hash).mockResolvedValue('encrypted_mock_password' as never)

      const result = await generatePassword('raw_password_123')

      expect(bcrypt.genSalt).toHaveBeenCalledTimes(1)
      expect(bcrypt.hash).toHaveBeenCalledWith('raw_password_123', 'salt_rounds')
      expect(result).toBe('encrypted_mock_password')
    })
  })

  describe('validatePassword', () => {
    it('should return true when the plain password matches the hashed one', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never)

      const isValid = await validatePassword('plain_string_password', 'hashed_password_string')

      expect(bcrypt.compare).toHaveBeenCalledWith('plain_string_password', 'hashed_password_string')
      expect(isValid).toBe(true)
    })

    it('should return false when the plain password does not match the hashed one', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never)

      const isValid = await validatePassword('plain_wrong_password', 'correct_hashed_password')
      expect(isValid).toBe(false)
    })
  })
})
