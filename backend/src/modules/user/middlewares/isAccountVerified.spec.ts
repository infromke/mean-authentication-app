import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import AppError from '../../../shared/errors/AppError.js'
import userService from '../user.service.js'

import isAccountVerified from './isAccountVerified.js'

describe('isAccountVerified', () => {
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

  it('should call next() if the user account is verified', async () => {
    userService.getSummaryById = vi.fn().mockResolvedValue({
      isAccountVerified: true,
    })

    await isAccountVerified(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(userService.getSummaryById).toHaveBeenCalledWith('6a3d70d4dd08603c3e977a9d')
    expect(nextFunction).toHaveBeenCalledTimes(1)
    expect(nextFunction).toHaveBeenCalled()
  })

  it('should throw an AppError (403) if the user account is not verified', async () => {
    userService.getSummaryById = vi.fn().mockResolvedValue({
      isAccountVerified: false,
    })

    const act = () =>
      isAccountVerified(mockRequest as Request, mockResponse as Response, nextFunction)

    await expect(act).rejects.toThrow(AppError)
    await expect(act).rejects.toThrow('Account must be verified to perform this action')
    expect(nextFunction).not.toHaveBeenCalled()
  })
})
