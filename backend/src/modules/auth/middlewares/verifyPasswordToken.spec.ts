import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

import verifyPasswordToken from './verifyPasswordToken.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

vi.mock('../../../shared/utils/normalizeJwtError.js', () => ({
  default: vi.fn((err) => err),
}))

describe('verifyPasswordToken', () => {
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
    mockRequest.cookies = { passwordToken: 'header.payload.signature' }
    vi.mocked(jwt.verify).mockReturnValue({ email: 'user@example.com' } as any)

    verifyPasswordToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(jwt.verify).toHaveBeenCalledWith('header.payload.signature', env.JWT_RESET_SECRET)
    expect(mockResponse.locals?.reset).toEqual({ email: 'user@example.com' })
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should throw an AppError (401) if passwordToken cookie is missing', () => {
    const act = () =>
      verifyPasswordToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(act).toThrow(AppError)
    expect(act).toThrow('Access denied')
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should catch JWT crashes, format them using normalizeJwtError and pass to next()', () => {
    mockRequest.cookies = { passwordToken: 'header.payload.signature' }
    const jwtError = new Error('jwt expired')

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw jwtError
    })

    verifyPasswordToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(normalizeJwtError).toHaveBeenCalledWith(jwtError)
    expect(nextFunction).toHaveBeenCalledWith(jwtError)
  })
})
