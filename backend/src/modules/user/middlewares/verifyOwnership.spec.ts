import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import AppError from '../../../shared/errors/AppError.js'
import verifyOwnership from '../../user/middlewares/verifyOwnership.js'

vi.mock('../user.service.js', () => ({
  default: {
    getSummaryById: vi.fn(),
  },
}))

describe('verifyOwnership', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      user: { id: '6a3d70d4dd08603c3e977a9d' },
      params: {},
      cookies: {},
    }
    mockResponse = {}
    nextFunction = vi.fn()
  })

  it('should call next() if the authenticated user matches the URL param ID', () => {
    mockRequest.params = { id: '6a3d70d4dd08603c3e977a9d' }

    verifyOwnership(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalledTimes(1)
  })

  it('should throw an AppError (403) if the authenticated user does not match the URL param ID', () => {
    mockRequest.params = { id: 'different_user_999' }

    const act = () =>
      verifyOwnership(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(act).toThrow(AppError)
    expect(act).toThrow('You can only modify your own account')
    expect(nextFunction).not.toHaveBeenCalled()
  })
})
