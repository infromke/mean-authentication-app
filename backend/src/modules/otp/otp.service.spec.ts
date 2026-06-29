import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Types } from 'mongoose'

import AppError from '../../shared/errors/AppError.js'

import type { IOtpPersistence } from './otp.model.js'
import { OtpService } from './otp.service.js'

describe('OtpService', () => {
  let otpServiceInstance: OtpService
  let mockOtpRepository: any

  beforeEach(() => {
    mockOtpRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      deleteOne: vi.fn(),
    }

    otpServiceInstance = new OtpService(mockOtpRepository)
  })

  describe('createOtp', () => {
    it('should successfully create an OTP document with correct parameters', async () => {
      const userId = '60d5ecb8b392d2121c8b4567'
      const otpType = 'VERIFY'

      const mockSavedOtp: Partial<IOtpPersistence> = {
        userId: new Types.ObjectId(userId),
        code: '123456',
        type: otpType,
        expiresAt: new Date(),
      }

      mockOtpRepository.create.mockResolvedValue(mockSavedOtp)

      const result = await otpServiceInstance.createOtp(userId, otpType)

      expect(mockOtpRepository.create).toHaveBeenCalledTimes(1)
      expect(result.code).toBe('123456')
      expect(result.type).toBe('VERIFY')
      expect(result.userId).toEqual(mockSavedOtp.userId)
    })
  })

  describe('validateOtp', () => {
    it('should successfully find and delete the correspondent OTP document', async () => {
      const userId = '6a39dabf70d1483cd03453ef'
      const otpType = 'RESET'

      mockOtpRepository.findById.mockResolvedValue({ code: '123456' })
      mockOtpRepository.deleteOne.mockResolvedValue({ deletedCount: 1 })

      const act = otpServiceInstance.validateOtp(userId, '123456', otpType)

      await expect(act).resolves.not.toThrow()

      expect(mockOtpRepository.deleteOne).toHaveBeenCalledWith(userId, otpType)
      expect(mockOtpRepository.deleteOne).toHaveBeenCalledTimes(1)
    })

    it('should throw an AppError (404) if the OTP code has expired or does not exist', async () => {
      mockOtpRepository.findById.mockResolvedValue(null)

      const act = () =>
        otpServiceInstance.validateOtp('6a39c5e2752f301aad1f814f', '123456', 'VERIFY')

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('Code not found or expired')
    })

    it('should throw an AppError (422) if the user provides an invalid code', async () => {
      mockOtpRepository.findById.mockResolvedValue({ code: '111111' })

      const act = () =>
        otpServiceInstance.validateOtp('6a39c5eaa74c7162e15028b0', '222222', 'VERIFY')

      await expect(act).rejects.toThrow('Invalid code')
    })
  })
})
