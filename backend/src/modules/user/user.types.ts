import { Document, Types } from 'mongoose'

// DTO para a criação de um usuário
export interface CreateUserDTO {
  name: string
  email: string
  password: string
}

// esqueleto da entidade
export interface IUser {
  name: string
  email: string
  password?: string
  isAccountVerified: boolean
  createdAt?: Date
  updatedAt?: Date
}

// representa o objeto exatamente como ele existe no banco
export interface IUserPersistence extends IUser {
  _id: Types.ObjectId // garante que o service saiba da existência do _id
}

// une os dados do usuário com todas as funções internas do mongoose, como .save(), .populate(), .isModified()
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId
}
