import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import env from '../../../config/env.js'
import AppError from '../../../shared/errors/AppError.js'
import normalizeJwtError from '../../../shared/utils/normalizeJwtError.js'

import verifyAccessToken from './verifyAccessToken.js'

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}))

vi.mock('../../../shared/utils/normalizeJwtError.js', () => ({
  default: vi.fn((err) => err),
}))

describe('verifyAccessToken', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = { cookies: {} }
    mockResponse = {}
    nextFunction = vi.fn()
  })

  it('should populate req.user and call next() if token is valid', () => {
    mockRequest.cookies = { accessToken: 'header.payload.signature' }
    vi.mocked(jwt.verify).mockReturnValue({ id: '6a3da7255fe2f670e9679ad6' } as any)

    verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(jwt.verify).toHaveBeenCalledWith('header.payload.signature', env.JWT_ACCESS_SECRET)
    expect(mockRequest.user).toEqual({ id: '6a3da7255fe2f670e9679ad6' })
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should throw an AppError (401) if no accessToken cookie is present', () => {
    const act = () =>
      verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(act).toThrow(AppError)
    expect(act).toThrow('Access denied')
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should catch JWT crashes, format them using normalizeJwtError and pass to next()', () => {
    mockRequest.cookies = { accessToken: 'header.payload.signature' }
    const jwtError = new Error('jwt expired')

    vi.mocked(jwt.verify).mockImplementation(() => {
      throw jwtError
    })

    verifyAccessToken(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(normalizeJwtError).toHaveBeenCalledWith(jwtError)
    expect(nextFunction).toHaveBeenCalledWith(jwtError)
  })
})
