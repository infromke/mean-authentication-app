import rateLimit from 'express-rate-limit'
import { describe, expect, it, vi } from 'vitest'

import AppError from '../errors/AppError.js'

import createLimiter from './createLimiter.js'

vi.mock('express-rate-limit', () => ({
  default: vi.fn(), // é um mock da biblioteca inteira
}))

describe('createLimiter', () => {
  it('should configure express-rate-limit with correct window time, max requests and handlers', () => {
    createLimiter(15, 100, 'Too many requests!')

    expect(vi.mocked(rateLimit)).toHaveBeenCalledWith(
      expect.objectContaining({
        windowMs: 15 * 60 * 1000, // 900.000ms (15min)
        max: 100,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: expect.any(Function), // verifica se um handler foi passado
      }),
    )
  })

  it('should intercept the limit handler and forward an AppError to next() middleware', () => {
    createLimiter(5, 10, 'Too many requests!')

    const configurations = vi.mocked(rateLimit).mock.calls[0]?.[0]
    const injectedHandler = configurations?.handler

    const req = {} as any
    const res = {} as any
    const next = vi.fn()

    if (injectedHandler) {
      injectedHandler(req, res, next, {} as any)
    }

    expect(next).toHaveBeenCalledTimes(1)

    const errorPassedToNext = next.mock.calls[0]?.[0]
    expect(errorPassedToNext).toBeInstanceOf(AppError)
    expect(errorPassedToNext.status).toBe(429)
    expect(errorPassedToNext.message).toBe('Too many requests!')
  })
})
