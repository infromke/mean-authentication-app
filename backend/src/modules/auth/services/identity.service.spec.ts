import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Types } from 'mongoose'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import cache from '../../../shared/lib/cache.js'
import mailService from '../../../shared/mail/mail.service.js'
import clearUserCache from '../../../shared/utils/clearUserCache.js'
import generateToken from '../../../shared/utils/generateToken.js'
import otpService from '../../otp/otp.service.js'
import userService from '../../user/user.service.js'

import identityService from './identity.service.js'

vi.mock('../../../config/env.js', () => ({
  default: { JWT_RESET_SECRET: 'a-really-secret-string-at-least-64-characters-long' },
}))

vi.mock('../../../shared/mail/mail.service.js', () => ({ default: { sendOtpEmail: vi.fn() } }))
vi.mock('../../../shared/utils/clearUserCache.js', () => ({ default: vi.fn() }))
vi.mock('../../../shared/utils/generateToken.js', () => ({ default: vi.fn() }))

vi.mock('../../otp/otp.service.js', () => ({
  default: {
    createOtp: vi.fn(),
    deleteOtp: vi.fn(),
    validateOtp: vi.fn(),
  },
}))

vi.mock('../../user/user.service.js', () => ({
  default: {
    getSummaryById: vi.fn(),
    findByEmail: vi.fn(),
    updateUser: vi.fn(),
  },
}))

vi.mock('../../../shared/lib/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    has: vi.fn(),
  },
}))

describe('IdentityService', () => {
  const userId = '6a41ee20083d2756adf44cb5'
  const userEmail = 'ana_carolina@example.com'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPasswordResetStatus', () => {
    const mockToken = 'header.payload-userEmail.signature'

    it('should return cached status if available', () => {
      const mockCached = { active: true, message: 'Cached response' }
      vi.mocked(cache.get).mockReturnValue(mockCached)

      const result = identityService.getPasswordResetStatus(mockToken)

      expect(cache.get).toHaveBeenCalledWith('password_reset_payload-userEmail')
      expect(result).toEqual(mockCached)
    })

    it('should set and return a new active status if cache is empty', () => {
      vi.mocked(cache.get).mockReturnValue(undefined)

      const result = identityService.getPasswordResetStatus(mockToken)

      expect(cache.set).toHaveBeenCalledWith('password_reset_payload-userEmail', {
        active: true,
        message: 'The password reset session is active',
      })
      expect(result.active).toBe(true)
    })
  })

  describe('sendEmailVerificationCode', () => {
    it('should throw an AppError (422) if the user account is already verified', async () => {
      vi.mocked(userService.getSummaryById).mockResolvedValue({ isAccountVerified: true } as any)

      await expect(identityService.sendEmailVerificationCode(userId)).rejects.toThrow(
        new AppError(422, 'Account has already been verified'),
      )
    })

    it('should create an OTP document and send a verification email if account is unverified', async () => {
      vi.mocked(userService.getSummaryById).mockResolvedValue({
        id: userId,
        email: userEmail,
        isAccountVerified: false,
      } as any)
      vi.mocked(otpService.createOtp).mockResolvedValue({ code: '123456' } as any)

      await identityService.sendEmailVerificationCode(userId)

      expect(otpService.createOtp).toHaveBeenCalledWith(userId, 'VERIFY')
      expect(mailService.sendOtpEmail).toHaveBeenCalledWith(userEmail, '123456', 'verification')
    })
  })

  describe('confirmEmailVerification', () => {
    it('should successfully validate OTP code, update user account status and clear cache', async () => {
      vi.mocked(userService.getSummaryById).mockResolvedValue({
        id: userId,
        isAccountVerified: false,
      } as any)

      await identityService.confirmEmailVerification(userId, '123456')

      expect(otpService.validateOtp).toHaveBeenCalledWith(userId, '123456', 'VERIFY')
      expect(userService.updateUser).toHaveBeenCalledWith(userId, { isAccountVerified: true })
      expect(clearUserCache).toHaveBeenCalledWith(userId)
    })
  })

  describe('sendPasswordResetCode', () => {
    it('should return a shadow token if the user does not exist', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null)
      vi.mocked(generateToken).mockReturnValue('shadow.jwt.token')

      const result = await identityService.sendPasswordResetCode(userEmail)

      expect(generateToken).toHaveBeenCalledWith(
        { email: 'for_security@example.com' },
        env.JWT_RESET_SECRET,
        '5m',
      )
      expect(result).toBe('shadow.jwt.token')
    })

    it('should append a recovery e-mail token inside the error payload when MongoDB throws a 11000 duplicate error', async () => {
      const mockUser = { _id: new Types.ObjectId(userId), email: userEmail }

      vi.mocked(userService.findByEmail).mockResolvedValue(mockUser as any)
      vi.mocked(otpService.createOtp).mockRejectedValue({ code: 11000 })
      vi.mocked(generateToken).mockReturnValue('email_recovery.jwt.token')

      try {
        await identityService.sendPasswordResetCode(userEmail)
        expect.fail('Should have thrown an AppError 409')
      } catch (error: any) {
        expect(error).toBeInstanceOf(AppError)
        expect(error.status).toBe(409)
        expect(error.message).toBe('A code has already been sent to this account')
        expect(error.data).toBe('email_recovery.jwt.token')
      }
    })
  })

  describe('resendOtpCode', () => {
    it('should throw an AppError (429) if the 60 second code request cooldown is active', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue({
        _id: new Types.ObjectId(userId),
      } as any)
      vi.mocked(cache.has).mockReturnValue(true)

      await expect(identityService.resendOtpCode('VERIFY', userEmail)).rejects.toThrow(
        new AppError(429, 'Wait 60s before requesting a new code'),
      )
    })

    it('should successfully clear previous OTP document, trigger resend and activate cooldown cache entry', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue({
        _id: new Types.ObjectId(userId),
        email: userEmail,
      } as any)
      vi.mocked(cache.has).mockReturnValue(false)
      vi.mocked(userService.getSummaryById).mockResolvedValue({
        id: userId,
        email: userEmail,
        isAccountVerified: false,
      } as any)
      vi.mocked(otpService.createOtp).mockResolvedValue({ code: '654321' } as any)

      await identityService.resendOtpCode('VERIFY', userEmail)

      expect(otpService.deleteOtp).toHaveBeenCalledWith(userId, 'VERIFY')
      expect(cache.set).toHaveBeenCalledWith(`otp_cooldown_VERIFY_${userId}`, true, 60)
    })

    it('should silently catch and neutralize 404 errors if the OTP context is RESET', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null)
      // se o e-mail não existir, nenhum erro é disparado para evitar user enumeration
      await expect(identityService.resendOtpCode('RESET', userEmail)).resolves.not.toThrow()
    })
  })
})
