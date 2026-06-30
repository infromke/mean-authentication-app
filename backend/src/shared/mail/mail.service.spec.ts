import { beforeEach, describe, expect, it, vi } from 'vitest'

import env from '../../config/env.js'

import { MailService } from './mail.service.js'

const { mockVerify, mockSendMail } = vi.hoisted(() => ({
  mockVerify: vi.fn(),
  mockSendMail: vi.fn(),
}))

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      verify: mockVerify,
      sendMail: mockSendMail,
    })),
  },
}))

describe('MailService', () => {
  let mailServiceInstance: MailService

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})

    mailServiceInstance = new MailService()
  })

  describe('verifyConnection', () => {
    it('should log a success message when connection is active', async () => {
      mockVerify.mockResolvedValue(true)
      const consoleSpy = vi.spyOn(console, 'log')

      await mailServiceInstance.verifyConnection()

      expect(mockVerify).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith('[NODEMAILER] is ready to take messages')
    })

    it('should catch and log the error message when connection fails', async () => {
      mockVerify.mockRejectedValue(new Error('SMTP Connection Timeout'))
      const consoleSpy = vi.spyOn(console, 'log')

      await mailServiceInstance.verifyConnection()

      expect(mockVerify).toHaveBeenCalledTimes(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        '\n[NODEMAILER] failed to establish connection:',
        'SMTP Connection Timeout',
      )
    })
  })

  describe('sendOtpEmail', () => {
    it('should build correct mail options and send the OTP message', async () => {
      mockSendMail.mockResolvedValue({
        envelope: { from: 'mailer@example.com', to: ['user@example.com'] },
      })

      await mailServiceInstance.sendOtpEmail('user@example.com', '123456', 'password reset')

      expect(mockSendMail).toHaveBeenCalledTimes(1)
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: env.SMTP_MAILER,
          to: 'user@example.com',
          subject: 'Authentication System code: 123456',
          text: expect.stringContaining('Your password reset code is:'),
          html: expect.any(String),
        }),
      )
    })

    it('should handle failures gracefully if transport execution crashes', async () => {
      mockSendMail.mockRejectedValue(new Error('Quota exceeded'))
      const consoleSpy = vi.spyOn(console, 'log')

      await mailServiceInstance.sendOtpEmail('user@example.com', '123456', 'verification')

      expect(consoleSpy).toHaveBeenCalledWith(
        '\n[NODEMAILER] failed to send e-mail:',
        'Quota exceeded',
      )
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should build welcome options and parse only the first name for the raw text header', async () => {
      mockSendMail.mockResolvedValue({
        envelope: { from: 'mailer@example.com', to: ['marcos_silva@example.com'] },
      })

      await mailServiceInstance.sendWelcomeEmail(
        'Marcos Silva Rodrigues',
        'marcos_silva@example.com',
      )

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: env.SMTP_MAILER,
          to: 'marcos_silva@example.com',
          subject: 'Welcome to my Authentication System!',
          text: expect.stringContaining('Dear Marcos,'),
          html: expect.any(String),
        }),
      )
    })
  })
})
