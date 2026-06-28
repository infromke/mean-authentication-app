import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { NextFunction, Request, Response } from 'express'

import AppError from '../errors/AppError.js'

import validateSchema from './validateSchema.js'

describe('validateSchema', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let nextFunction: NextFunction

  const testSchema = z.object({
    body: z.object({
      email: z.email('Invalid e-mail format'),
      otp: z.preprocess((val) => Number(val), z.number()), // apenas para testar a transformação
    }),
    query: z.object({
      search: z.string().optional(),
    }),
    params: z.object({
      id: z.string(),
    }),
  })

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      body: {},
      query: {},
      params: {},
    }
    mockResponse = {}
    nextFunction = vi.fn()
  })

  it('should successfully parse, mutate/transform request data and call next()', () => {
    mockRequest.body = { email: 'user@example.com', otp: '261932' }
    mockRequest.query = { search: 'test_query_10' }
    mockRequest.params = { id: '6a3f0bf72b4969b23e9ce42d' }

    const middleware = validateSchema(testSchema)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(mockRequest.body).toEqual({ email: 'user@example.com', otp: 261932 })
    expect(mockRequest.query).toEqual({ search: 'test_query_10' })
    expect(mockRequest.params).toEqual({ id: '6a3f0bf72b4969b23e9ce42d' })
    expect(nextFunction).toHaveBeenCalledWith()
  })

  it('should catch ZodError and throw a formatted AppError (400)', () => {
    mockRequest.body = { email: 'invalid_email_here', otp: 'not_a_number' }
    mockRequest.query = {}
    mockRequest.params = {}

    const middleware = validateSchema(testSchema)
    const act = () => middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(act).toThrow(AppError)
    try {
      act()
    } catch (error: any) {
      expect(error.status).toBe(400)
      expect(error.message).toBe('Your request has invalid fields')
      expect(error.errors).toEqual(
        expect.arrayContaining([
          { field: 'email', error: 'Invalid e-mail format' },
          { field: 'otp', error: expect.any(String) },
        ]),
      )
    }
    expect(nextFunction).not.toHaveBeenCalled()
  })

  it('should pass non-Zod errors directly to the next() function', () => {
    const brokenSchema = {
      parse: vi.fn(() => {
        throw new Error('Unexpected error that has nothing to do with Zod...')
      }),
    } as any

    const middleware = validateSchema(brokenSchema)
    middleware(mockRequest as Request, mockResponse as Response, nextFunction)

    expect(nextFunction).toHaveBeenCalledWith(expect.any(Error))
    expect(nextFunction).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unexpected error that has nothing to do with Zod...' }),
    )
  })
})
