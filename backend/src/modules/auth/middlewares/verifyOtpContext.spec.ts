import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import verifyAccessToken from './verifyAccessToken.js'
import verifyOtpContext from './verifyOtpContext.js'
import verifyResetEmailToken from './verifyResetEmailToken.js'

vi.mock('./verifyAccessToken.js', () => ({
  default: vi.fn(),
}))

vi.mock('./verifyResetEmailToken.js', () => ({
  default: vi.fn(),
}))

describe('verifyOtpContext', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = { body: {} }
    mockResponse = {}
    nextFunction = vi.fn()
  })

  it('should route to verifyAccessToken if the OTP type is VERIFY', () => {
    mockRequest.body.type = 'VERIFY'

    verifyOtpContext(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(verifyAccessToken).toHaveBeenCalledWith(mockRequest, mockResponse, nextFunction)
    expect(verifyResetEmailToken).not.toHaveBeenCalled()
  })

  it('should route to verifyResetEmailToken if the OTP type is RESET', () => {
    mockRequest.body.type = 'RESET'

    verifyOtpContext(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(verifyResetEmailToken).toHaveBeenCalledWith(mockRequest, mockResponse, nextFunction)
    expect(verifyAccessToken).not.toHaveBeenCalled()
  })
})
