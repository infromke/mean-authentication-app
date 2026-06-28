import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Types } from 'mongoose'

import AppError from '../../shared/errors/AppError.js'
import cache from '../../shared/lib/cache.js'
import clearUserCache from '../../shared/utils/clearUserCache.js'

import type { IUserPersistence } from './user.model.js'
import { UserService } from './user.service.js'

vi.mock('../../shared/lib/cache.js', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    keys: vi.fn(() => []),
  },
}))

vi.mock('../../shared/utils/clearUserCache.js', () => ({
  default: vi.fn(),
}))

describe('UserService', () => {
  let userServiceInstance: UserService
  let mockMailServiceInstance: any
  let mockUserRepository: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUserRepository = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateById: vi.fn(),
      deleteById: vi.fn(),
    }
    mockMailServiceInstance = {
      sendWelcomeEmail: vi.fn(),
    }

    userServiceInstance = new UserService(mockUserRepository, mockMailServiceInstance)
  })

  describe('findAllUsers', () => {
    it('should return the cached pagination result if it exists in cache', async () => {
      const mockQuery = {
        page: 0,
        size: 10,
        sort: { field: 'name', direction: 'asc' },
        search: undefined,
        verified: undefined,
      }
      const mockCachedData = { content: [], totalElements: 0, totalPages: 0 }

      vi.mocked(cache.get).mockReturnValue(mockCachedData)

      const result = await userServiceInstance.findAllUsers(mockQuery)

      expect(result).toEqual(mockCachedData)
      expect(mockUserRepository.findAll).not.toHaveBeenCalled()
    })

    it('should query the repository, apply pagination fallbacks, and cache the result on cache miss', async () => {
      vi.mocked(cache.get).mockReturnValue(undefined)

      const mockUserRaw = {
        _id: '6a3b2dd25c2e5d36fa258cd4',
        name: 'Rogério Souza',
        email: 'rogerio_souza@example.com',
        isAccountVerified: false,
      }
      mockUserRepository.findAll.mockResolvedValue({
        users: [mockUserRaw],
        totalElements: 1,
      })

      const query = {
        page: 0,
        size: 50,
        sort: { field: 'id', direction: 'asc' },
        search: undefined,
        verified: undefined,
      }

      const result = await userServiceInstance.findAllUsers(query)

      expect(mockUserRepository.findAll).toHaveBeenCalledWith({
        search: undefined,
        verified: undefined,
        page: 0,
        size: 50,
        sortField: '_id',
        sortOrder: 1,
      })
      expect(cache.set).toHaveBeenCalledTimes(1)
      expect((result.content[0] as any)?.name).toBe('Rogério Souza')
    })
  })

  describe('findByEmail', () => {
    it('should return an user document from the repository when the provided email matches', async () => {
      const mockUser = { email: 'jade@example.com' }
      mockUserRepository.findOne.mockResolvedValue(mockUser)

      const result = await userServiceInstance.findByEmail('jade@example.com')

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ email: 'jade@example.com' }, {})
      expect(result).toEqual(mockUser)
    })
  })

  describe('findEntityById', () => {
    it('should return an user document if found by ID', async () => {
      const mockUser = { _id: '6a3b2f1bb93ab8c53c243e0a', name: 'Larissa' }
      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await userServiceInstance.findEntityById('6a3b2f1bb93ab8c53c243e0a')

      expect(result).toEqual(mockUser)
    })

    it('should throw an AppError (404) if the repository returns null', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      const act = () => userServiceInstance.findEntityById('6a3b2f5794d792b330701dd8')

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('User not found')
    })
  })

  describe('getSummaryById', () => {
    it('should return the cached formatted version of an user document if it exists in cache', async () => {
      const mockCachedData = { name: 'Matheus Campos', email: 'matheus_campos@example.com' }
      vi.mocked(cache.get).mockReturnValue(mockCachedData)

      const result = await userServiceInstance.getSummaryById('6a3b419b5ce4b6964d530b3f')

      expect(result).toEqual(mockCachedData)
      expect(mockUserRepository.findById).not.toHaveBeenCalled()
    })

    it('should return the formatted version of an user document if found by ID and cache the result on cache miss', async () => {
      const userId = '6a3b46e1855f116a5b31a5e0'

      const mockUser = {
        _id: new Types.ObjectId(userId),
        name: 'Maria Almeida',
        email: 'maria_almeida@example.com',
        password: 'hashed_password_string',
        isAccountVerified: false,
      }

      vi.mocked(cache.get).mockReturnValue(undefined)
      mockUserRepository.findById.mockResolvedValue(mockUser)

      const result = await userServiceInstance.getSummaryById(userId)

      expect(mockUserRepository.findById).toHaveBeenCalledTimes(1)
      expect(result).toEqual({
        id: userId,
        name: 'Maria Almeida',
        email: 'maria_almeida@example.com',
        isAccountVerified: false,
      })
      expect(result).not.toHaveProperty('password')
      expect(cache.set).toHaveBeenCalledTimes(1)
    })

    it('should throw an AppError (404) if the repository returns null', async () => {
      mockUserRepository.findById.mockResolvedValue(null)

      const act = () => userServiceInstance.getSummaryById('6a3b4ead5cab76cc08ee1da8')

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('User not found')
      expect(cache.set).not.toHaveBeenCalled()
    })
  })

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userObjectId = new Types.ObjectId('6a3b5edcee20c5f36d40ad37')

      const mockSavedUser: Partial<IUserPersistence> = {
        _id: userObjectId,
        name: 'Michele Santos',
        email: 'michele_santos@example.com',
        isAccountVerified: false,
      }

      mockUserRepository.findOne.mockResolvedValue(null)
      mockUserRepository.create.mockResolvedValue(mockSavedUser)

      const result = await userServiceInstance.createUser({
        name: 'Michele Santos',
        email: 'michele_santos@example.com',
        password: 'goodRandomPassword123',
      })

      expect(mockUserRepository.create).toHaveBeenCalledTimes(1)
      expect(mockMailServiceInstance.sendWelcomeEmail).toHaveBeenCalledWith(
        'Michele Santos',
        'michele_santos@example.com',
      )
      expect(clearUserCache).toHaveBeenCalledTimes(1)
      expect(result.newUser.id).toBe(String(userObjectId))
      expect(result.accessToken).toBeDefined()
    })

    it('should throw an AppError (409) while creating an user with an existing e-mail', async () => {
      const mockExistingUser = {
        email: 'email_that_already_exists@example.com',
      }
      mockUserRepository.findOne.mockResolvedValue(mockExistingUser)

      const act = () =>
        userServiceInstance.createUser({
          name: 'Francisco Rodrigues',
          email: 'email_that_already_exists@example.com',
          password: 'goodRandomPassword123',
        })

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('The provided e-mail is already in use')
      expect(mockUserRepository.create).not.toHaveBeenCalled()
      expect(clearUserCache).not.toHaveBeenCalled()
    })
  })

  describe('updateUser', () => {
    const userId = '6a3b65a5f1027ad15c90beef'

    it('should successfully update an user without changing their email and clear their associated cache', async () => {
      const updateData = { name: 'Novo Nome da Silva' }

      const mockUpdatedUser = {
        _id: userId,
        name: 'Novo Nome da Silva',
        email: 'same_email_as_before@example.com',
      }

      mockUserRepository.updateById.mockResolvedValue(mockUpdatedUser)

      const result = await userServiceInstance.updateUser(userId, updateData)

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(userId, {
        name: 'Novo Nome da Silva',
      })
      expect(clearUserCache).toHaveBeenCalledWith(userId)
      expect((result as any).name).toBe('Novo Nome da Silva')
    })

    it('should revert the account verification status when a brand new available e-mail is provided and clear the associated cache', async () => {
      const updateData = { email: 'new_brand_email@example.com' }

      const mockUpdatedUser = {
        _id: userId,
        name: 'Heitor Oliveira',
        email: 'new_brand_email@example.com',
        isAccountVerified: false,
      }

      mockUserRepository.findOne.mockResolvedValue(null)
      mockUserRepository.updateById.mockResolvedValue(mockUpdatedUser)

      await userServiceInstance.updateUser(userId, updateData)

      expect(mockUserRepository.updateById).toHaveBeenCalledWith(userId, {
        email: 'new_brand_email@example.com',
        isAccountVerified: false,
      })
      expect(clearUserCache).toHaveBeenCalledWith(userId)
    })

    it('should throw an AppError (409) if the new e-mail provided belongs to another user', async () => {
      const updateData = { email: 'cloned_email@example.com' }
      const mockOtherUser = { _id: 'another_different_id_123', email: 'cloned_email@example.com' }

      mockUserRepository.findOne.mockResolvedValue(mockOtherUser)

      const act = () => userServiceInstance.updateUser(userId, updateData)

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('The provided e-mail is already in use')
      expect(mockUserRepository.updateById).not.toHaveBeenCalled()
      expect(clearUserCache).not.toHaveBeenCalled()
    })

    it('should throw an AppError (404) if the repository returns null (user not found)', async () => {
      const updateData = { name: 'Ghost User' }

      mockUserRepository.updateById.mockResolvedValue(null)

      const act = () => userServiceInstance.updateUser(userId, updateData)

      await expect(act).rejects.toThrow(AppError)
      await expect(act).rejects.toThrow('User not found')
      expect(clearUserCache).not.toHaveBeenCalled()
    })

    describe('deleteUser', () => {
      it('should successfully delete an user if found by ID and clear their associated cache', async () => {
        const mockUser = { _id: new Types.ObjectId(userId) }

        mockUserRepository.deleteById.mockResolvedValue(mockUser)
        await userServiceInstance.deleteUser(userId)

        expect(clearUserCache).toHaveBeenCalledWith(userId)
      })

      it('should throw an AppError (404) if the repository returns null', async () => {
        mockUserRepository.deleteById.mockResolvedValue(null)
        const act = () => userServiceInstance.deleteUser(userId)

        await expect(act).rejects.toThrow(AppError)
        await expect(act).rejects.toThrow('User not found')
        expect(clearUserCache).not.toHaveBeenCalled()
      })
    })
  })
})
