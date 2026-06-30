import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Types } from 'mongoose'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import cache from '../../../shared/lib/cache.js'
import clearUserCache from '../../../shared/utils/clearUserCache.js'
import generateToken from '../../../shared/utils/generateToken.js'
import { validatePassword } from '../../../shared/utils/hash.js'
import userService from '../../user/user.service.js'
import formatUserObject from '../../user/utils/formatUserObject.js'

import authService from './auth.service.js'

vi.mock('../../../config/env.js', () => ({
  default: { JWT_ACCESS_SECRET: 'a-really-secret-string-at-least-64-characters-long' },
}))

vi.mock('../../../shared/utils/clearUserCache.js', () => ({ default: vi.fn() }))
vi.mock('../../../shared/utils/generateToken.js', () => ({ default: vi.fn() }))
vi.mock('../../../shared/utils/hash.js', () => ({ validatePassword: vi.fn() }))
vi.mock('../../user/utils/formatUserObject.js', () => ({ default: vi.fn() }))

vi.mock('../../../shared/lib/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('../../user/user.service.js', () => ({
  default: {
    getSummaryById: vi.fn(),
    findByEmail: vi.fn(),
  },
}))

describe('AuthService', () => {
  const userId = '6a41db456a69bb59261fda65'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAuthenticatedUser', () => {
    const mockUser = {
      id: userId,
      email: 'roberto_braga@example.com',
      name: 'Roberto Braga dos Anjos',
    }

    it('should return the cached user result if it exists in cache', async () => {
      vi.mocked(cache.get).mockReturnValue(mockUser)

      const result = await authService.getAuthenticatedUser(userId)

      expect(cache.get).toHaveBeenCalledWith(`user_session_${userId}`)
      expect(userService.getSummaryById).not.toHaveBeenCalled()
      expect(result).toEqual(mockUser)
    })

    it('should call UserService and store the result on cache miss with TTL 120s', async () => {
      vi.mocked(cache.get).mockReturnValue(undefined)
      vi.mocked(userService.getSummaryById).mockResolvedValue(mockUser as any)

      const result = await authService.getAuthenticatedUser(userId)

      expect(cache.get).toHaveBeenCalledWith(`user_session_${userId}`)
      expect(userService.getSummaryById).toHaveBeenCalledWith(userId)
      expect(cache.set).toHaveBeenCalledWith(`user_session_${userId}`, mockUser, 120)
      expect(result).toEqual(mockUser)
    })
  })

  describe('authenticate', () => {
    const credentials = { email: 'login@example.com', password: 'randompassword123' }
    const fakeHash = '$2a$10$EBj1t.NspLYcG8p/Qts4Bue35p1NCIR29jNwtF0P29eVKxRV2s5cm'

    it('should authenticate successfully with valid credentials', async () => {
      const mockDbUser = {
        _id: new Types.ObjectId(userId),
        email: credentials.email,
        password: 'real_hashed_password',
      }
      const mockFormattedUser = { id: userId, email: credentials.email }

      vi.mocked(userService.findByEmail).mockResolvedValue(mockDbUser as any)
      vi.mocked(validatePassword).mockResolvedValue(true)
      vi.mocked(generateToken).mockReturnValue('header.payload.signature')
      vi.mocked(formatUserObject).mockReturnValue(mockFormattedUser as any)

      const result = await authService.authenticate(credentials)

      expect(userService.findByEmail).toHaveBeenCalledWith(credentials.email, '+password')
      expect(validatePassword).toHaveBeenCalledWith(credentials.password, 'real_hashed_password')
      expect(generateToken).toHaveBeenCalledWith({ id: userId }, env.JWT_ACCESS_SECRET, '1d')
      expect(clearUserCache).toHaveBeenCalledWith(userId)
      expect(result).toEqual({ user: mockFormattedUser, accessToken: 'header.payload.signature' })
    })

    it('should throw an AppError (401) and validate a fake hash if user is not found', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null)
      vi.mocked(validatePassword).mockResolvedValue(false)

      await expect(authService.authenticate(credentials)).rejects.toThrow(
        new AppError(401, 'Invalid credentials'),
      )

      expect(validatePassword).toHaveBeenCalledWith(credentials.password, fakeHash)
    })

    it('should throw an AppError (401) if user exists but password is invalid', async () => {
      const mockDbUser = { _id: userId, password: 'real_hashed_password' }
      vi.mocked(userService.findByEmail).mockResolvedValue(mockDbUser as any)
      vi.mocked(validatePassword).mockResolvedValue(false)

      await expect(authService.authenticate(credentials)).rejects.toThrow(
        new AppError(401, 'Invalid credentials'),
      )

      expect(validatePassword).toHaveBeenCalledWith(credentials.password, 'real_hashed_password')
      expect(generateToken).not.toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    it('should trigger clearUserCache if an id is supplied', () => {
      authService.disconnect(userId)
      expect(clearUserCache).toHaveBeenCalledWith(userId)
    })

    it('should not trigger clearUserCache if no id is provided', () => {
      authService.disconnect('')
      expect(clearUserCache).not.toHaveBeenCalled()
    })
  })
})
