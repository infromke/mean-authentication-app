import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import env from '../../config/env.js'

import formatProblemDetails from '../errors/utils/formatProblemDetails.js'

import errorHandler from './errorHandler.js'

vi.mock('../../config/env.js', () => ({
  default: {
    NODE_ENV: 'development',
  },
}))

vi.mock('../errors/utils/formatProblemDetails.js', () => ({
  default: vi.fn(),
}))

describe('errorHandler Middleware', () => {
  let mockError: Error
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  const errorBody = {
    type: 'about:blank',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred. Please try again later.',
    instance: '/users',
  }

  beforeEach(() => {
    vi.clearAllMocks()

    mockError = new Error('Operation `users.find()` buffering timed out after 10000ms')
    mockError.stack =
      'MongooseError: Operation `users.find()` buffering timed out after 10000ms\n    at Timeout.<anonymous>...'

    mockRequest = {
      originalUrl: '/users',
    }

    mockResponse = {
      setHeader: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    }

    nextFunction = vi.fn()

    vi.mocked(formatProblemDetails).mockReturnValue({
      status: 500,
      body: errorBody,
    })
  })

  it('should format the error using RFC 7807, set problem+json header and return response', () => {
    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction)

    expect(formatProblemDetails).toHaveBeenCalledWith(mockError, '/users')
    expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/problem+json')
    expect(mockResponse.status).toHaveBeenCalledWith(500)
    expect(mockResponse.json).toHaveBeenCalledWith(errorBody)
  })

  it('should print the error stack to console.error when in development mode', () => {
    env.NODE_ENV = 'development' // !

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction)

    expect(consoleSpy).toHaveBeenCalledWith(mockError.stack)
    consoleSpy.mockRestore()
  })

  it('should NOT print the error stack to console.error when in production mode', () => {
    env.NODE_ENV = 'production' // !

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    errorHandler(mockError, mockRequest as Request, mockResponse as Response, nextFunction)

    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
