import { beforeEach, describe, expect, it, vi } from 'vitest'

import env from '../../../config/env.js'
import AppError from '../AppError.js'

import formatProblemDetails from './formatProblemDetails.js'

vi.mock('../../../config/env.js', () => ({
  default: { NODE_ENV: 'production' },
}))

describe('formatProblemDetails', () => {
  const fakeUrl = 'users/'

  beforeEach(() => {
    env.NODE_ENV = 'production'
  })

  describe('handling standard JavaScript Errors', () => {
    it('should format a generic Error as a 500 Internal Server Error', () => {
      const genericError = new Error('An unexpected error occurred. Please try again later.')

      const result = formatProblemDetails(genericError, fakeUrl)

      expect(result.status).toBe(500)
      expect(result.body).toEqual({
        type: 'about:blank',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred. Please try again later.',
        instance: fakeUrl,
      })
      expect(result.body.stack).toBeUndefined()
    })
  })

  describe('handling AppError in Production environment', () => {
    it('should use the public message for the detail field and omit both stack trace and technical debug info', () => {
      env.NODE_ENV = 'production'

      const appError = new AppError(
        409,
        [
          'The provided e-mail is already in use',
          'MongoServerError: E11000 duplicate key error for email field',
        ],
        'EMAIL_ALREADY_IN_USE',
      )

      const result = formatProblemDetails(appError, fakeUrl)

      expect(result.status).toBe(409)
      expect(result.body.title).toBe('Conflict')
      expect(result.body.code).toBe('EMAIL_ALREADY_IN_USE')
      expect(result.body.detail).toBe('The provided e-mail is already in use') // msg pública simples
      expect(result.body.stack).toBeUndefined() // stack NÃO deve aparecer
    })
  })

  describe('handling AppError in Development environment', () => {
    beforeEach(() => {
      env.NODE_ENV = 'development' // !
    })

    it('should swap the detail field into displaying technical debug message and inject stack trace', () => {
      const appError = new AppError(404, [
        'User not found',
        "User with ID '6a3aff5103c66fab24db420d' not found",
      ])
      appError.stack = 'Error: User not found\n Stack trace...'

      const result = formatProblemDetails(appError, fakeUrl)

      expect(result.status).toBe(404)
      expect(result.body.detail).toBe("User with ID '6a3aff5103c66fab24db420d' not found") // msg técnica
      expect(result.body.stack).toBe('Error: User not found\n Stack trace...') // stack DEVE aparecer
    })

    it('should fallback to public message as detail if no debug message is available', () => {
      const appError = new AppError(401, 'A generic message for unauthorized/unauthenticated cases')

      const result = formatProblemDetails(appError, fakeUrl)

      expect(result.status).toBe(401)
      expect(result.body.detail).toBe('A generic message for unauthorized/unauthenticated cases')
    })
  })
})
