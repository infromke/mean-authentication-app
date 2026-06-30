import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

import verifyResetEmailToken from './verifyResetEmailToken.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

vi.mock('../../../shared/utils/normalizeJwtError.js', () => ({
  default: vi.fn((err) => err),
}))

describe('verifyResetEmailToken', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = { cookies: {} }
    mockResponse = { locals: {} }
    nextFunction = vi.fn()
  })

  it('should verify token, assign e-mail to res.locals.reset and call next()', () => {
    mockRequest.cookies = { resetEmailToken: 'header.payload.signature' }
    vi.mocked(jwt.verify).mockReturnValue({ email: 'user@example.com' } as any)

    verifyResetEmailToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(jwt.verify).toHaveBeenCalledWith('header.payload.signature', env.JWT_RESET_SECRET)
    expect(mockResponse.locals?.reset).toEqual({ email: 'user@example.com' })
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should throw an AppError (401) if resetEmailToken cookie is missing', () => {
    const act = () =>
      verifyResetEmailToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(act).toThrow(AppError)
    expect(act).toThrow('Access denied')
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should catch JWT crashes, format them using normalizeJwtError and pass to next()', () => {
    mockRequest.cookies = { resetEmailToken: 'header.payload.signature' }
    const jwtError = new Error('secret or public key must be provided')

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw jwtError
    })

    verifyResetEmailToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(normalizeJwtError).toHaveBeenCalledWith(jwtError)
    expect(nextFunction).toHaveBeenCalledWith(jwtError)
  })
})
