import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import AppError from '../../../shared/errors/AppError.js'

import { isAuthenticated, isGuest } from './isLoggedIn.js'

vi.mock('../user.service.js', () => ({
  default: {
    getSummaryById: vi.fn(),
  },
}))

describe('isLoggedIn Middlewares', () => {
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

  describe('isAuthenticated', () => {
    it('should call next() if no accessToken cookie is present', () => {
      isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(1)
    })

    it('should throw an AppError (400) if an accessToken cookie exists', () => {
      mockRequest.cookies = { accessToken: 'header.payload.signature' }

      const act = () =>
        isAuthenticated(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(act).toThrow(AppError)
      expect(act).toThrow('You are already logged in')
      expect(nextFunction).not.toHaveBeenCalled()
    })
  })

  describe('isGuest', () => {
    it('should call next() if no accessToken cookie is present', () => {
      isGuest(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(nextFunction).toHaveBeenCalledTimes(1)
    })

    it('should throw an AppError (403) if an accessToken cookie exists', () => {
      mockRequest.cookies = { accessToken: 'header.payload.signature' }

      const act = () => isGuest(mockRequest as Request, mockResponse as Response, nextFunction)

      expect(act).toThrow(AppError)
      expect(act).toThrow('Cannot proceed while logged in')
      expect(nextFunction).not.toHaveBeenCalled()
    })
  })
})
