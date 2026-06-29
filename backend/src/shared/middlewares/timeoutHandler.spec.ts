import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { NextFunction, Request, Response } from 'express'

import AppError from '../errors/AppError.js'

import timeoutHandler from './timeoutHandler.js'

describe('timeoutHandler Middleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction
  let eventListeners: Record<string, () => void>

  beforeEach(() => {
    vi.useFakeTimers() // cronômetros falsos para controlar o setTimeout
    eventListeners = {}

    mockRequest = {}
    mockResponse = {
      headersSent: false,
      // intercepta os eventos res.on('finish') e res.on('close')
      on: vi.fn().mockImplementation((event: string, callback: () => void) => {
        eventListeners[event] = callback
        return mockResponse
      }),
    }
    nextFunction = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers() // restaura os cronômetros
  })

  it('should call next() immediately to continue down the middleware chain', () => {
    const middleware = timeoutHandler(3)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalledTimes(1)
    expect(nextFunction).not.toHaveBeenCalledWith(expect.any(Error))
  })

  it('should trigger an AppError (503) if the time window expires and headers were not sent', () => {
    const middleware = timeoutHandler(3)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    // avança o timer virtual em 3 segundos
    vi.advanceTimersByTime(3000)

    expect(nextFunction).toHaveBeenCalledTimes(2) // next() e next(new AppError)
    expect(nextFunction).toHaveBeenLastCalledWith(
      new AppError(
        503,
        'The server took too long to respond. The request was aborted to prevent resource exhaustion.',
      ),
    )
  })

  it('should not trigger an AppError (503) if response headers have already been sent', () => {
    const middleware = timeoutHandler(3)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    mockResponse.headersSent = true

    vi.advanceTimersByTime(3000)

    expect(nextFunction).toHaveBeenCalledTimes(1) // apenas a chamada inicial de fluxo next()
    expect(nextFunction).not.toHaveBeenLastCalledWith(expect.any(AppError))
  })

  it('should clear the timer when the response triggers the "finish" event', () => {
    const middleware = timeoutHandler(3)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    if (eventListeners['finish']) eventListeners['finish']() // finish: () => clearTimeout(timer)

    vi.advanceTimersByTime(3000)

    expect(nextFunction).toHaveBeenCalledTimes(1) // apenas o next() inicial
  })

  it('should clear the timer when the response triggers the "close" event', () => {
    const middleware = timeoutHandler(3)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    if (eventListeners['close']) eventListeners['close']() // close: () => clearTimeout(timer)

    vi.advanceTimersByTime(3000)

    expect(nextFunction).toHaveBeenCalledTimes(1) // apenas o next() inicial
  })
})
