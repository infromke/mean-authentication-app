import type { FilterQuery, ProjectionType, Types } from 'mongoose'
import type { FindAllParams } from '../../shared/types/pagination.types.js'
import User, { type IUser, type IUserDocument, type IUserPersistence } from './user.model.js'

interface PaginatedUsers {
  users: IUserPersistence[]
  totalElements: number
}

class UserRepository {
  /**
   * Executa uma busca paginada e concorrente (via Promise.all) otimizada com documentos POJO.
   */
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

  /**
   * Executa queries de busca genéricas retornando uma estrutura de dados POJO.
   */
  async findOne(
    filter: FilterQuery<IUserDocument>,
    projection: ProjectionType<IUserDocument> = {},
  ): Promise<IUserPersistence | null> {
    return await User.findOne(filter, projection).lean<IUserPersistence | null>()
  }

  /**
   * Busca por ID direto via Mongoose retornando um documento POJO.
   */
  async findById(id: string | Types.ObjectId): Promise<IUserPersistence | null> {
    return await User.findById(id).lean<IUserPersistence | null>()
  }

  /**
   * Salva o usuário e converte a instância do modelo Mongoose em um objeto POJO.
   */
  async create(data: Partial<IUser>): Promise<IUserPersistence> {
    const user = await User.create(data)
    return user.toObject() as IUserPersistence // converte para objeto JS puro
  }

  /**
   * Atualiza o documento por ID retornando a nova versão modificada, em POJO, pós-operação.
   */
  async updateById(
    id: string | Types.ObjectId,
    data: Partial<IUser>,
  ): Promise<IUserPersistence | null> {
    return await User.findByIdAndUpdate(id, data, { new: true }).lean<IUserPersistence | null>()
  }

  /**
   * Remove o documento do banco de dados por ID e retorna o estado, em POJO, anterior à exclusão.
   */
  async deleteById(id: string | Types.ObjectId): Promise<IUserPersistence | null> {
    return await User.findByIdAndDelete(id).lean<IUserPersistence | null>()
  }
}

export default new UserRepository()
