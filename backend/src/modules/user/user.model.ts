import mongoose, { Document, Schema, Types } from 'mongoose'

import { generatePassword } from '../../shared/utils/hash.js'

// esqueleto da entidade
export interface IUser {
  name: string
  email: string
  password?: string
  isAccountVerified: boolean
  createdAt?: Date
  updatedAt?: Date
}

// representa o objeto exatamente como ele existe no banco, com _id e datas obrigatórias
export interface IUserPersistence extends IUser {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

// une os dados do usuário com todas as funções internas do mongoose, como .save(), .populate(), .isModified()
export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId
}

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [56, 'Name cannot exceed 56 characters'],
      trim: true,
      required: [true, 'Name is required'],
    },
    email: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      required: [true, 'Email is required'],
      match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Invalid e-mail format'],
    },
    password: {
      type: String,
      select: false,
      required: [true, 'Password is required'],
    },
    isAccountVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
)

//  faz a senha ser hasheada na operação User.save()
userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next()

  try {
    if (this.password) {
      const hash = await generatePassword(this.password)
      this.password = hash
    }
    next()
  } catch (error) {
    next(error as Error)
  }
})

//  faz a senha ser hasheada nas operações User.findByIdAndUpdate() e User.findOneAndUpdate()
userSchema.pre('findOneAndUpdate', async function (next) {
  // pega o objeto do "update" ex.:{ password: 'nova_senha' })
  const update = this.getUpdate() as any

  // verifica se a senha está sendo atualizada no objeto
  if (update && update.password) {
    try {
      const hash = await generatePassword(update.password)
      update.password = hash
    } catch (error) {
      next(error as Error)
    }
  }
  next()
})

const User = mongoose.model<IUserDocument>('User', userSchema)

export default User
