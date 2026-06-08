import type { FilterQuery, ProjectionType, Types } from 'mongoose'
import type { FindAllParams } from '../../types/pagination.types.js'
import User, { type IUser, type IUserDocument, type IUserPersistence } from './user.model.js'

interface PaginatedUsers {
  users: IUserPersistence[]
  totalElements: number
}

class UserRepository {
  async findAll({ page, size, sortField, sortOrder }: FindAllParams): Promise<PaginatedUsers> {
    const skip = page * size

    const [users, totalElements] = await Promise.all([
      User.find()
        .sort({ [sortField]: sortOrder }) // Ordenação dinâmica
        .skip(skip)
        .limit(size)
        .lean<IUserPersistence[]>(), // retorna dados puros (Plain Old JavaScript Objects)
      User.countDocuments(),
    ])

    return { users, totalElements }
  }

  async findOne(
    filter: FilterQuery<IUserDocument>,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<IUserPersistence | null> {
    return await User.findOne(filter, projection).lean<IUserPersistence | null>()
  }

  async findById(id: string | Types.ObjectId): Promise<IUserPersistence | null> {
    return await User.findById(id).lean<IUserPersistence | null>()
  }

  async create(data: Partial<IUser>): Promise<IUserPersistence> {
    const user = await User.create(data)
    return user.toObject() as IUserPersistence // converte para objeto JS puro
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<IUser>,
  ): Promise<IUserPersistence | null> {
    return await User.findByIdAndUpdate(id, data, { new: true }).lean<IUserPersistence | null>()
  }

  async remove(id: string | Types.ObjectId): Promise<IUserPersistence | null> {
    return await User.findByIdAndDelete(id).lean<IUserPersistence | null>()
  }
}

export default new UserRepository()
