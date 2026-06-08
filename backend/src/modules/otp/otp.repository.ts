import type { Types } from 'mongoose'
import Otp, { type IOtp, type IOtpPersistence } from './otp.model.js'
import type { OtpType } from './otp.types.js'

// para operações de deleção
interface DeleteResult {
  acknowledged: boolean
  deletedCount: number
}

class OtpRepository {
  async create(data: Partial<IOtp>): Promise<IOtpPersistence> {
    const otp = await Otp.create(data)
    return otp.toObject() as IOtpPersistence // converte para objeto JS puro
  }

  async findById(id: string | Types.ObjectId, type: OtpType): Promise<IOtpPersistence | null> {
    return await Otp.findOne({
      userId: id,
      type,
      expiresAt: { $gt: new Date() },
    }).lean<IOtpPersistence | null>()
  }

  async remove(userId: string | Types.ObjectId, type: OtpType): Promise<DeleteResult> {
    return await Otp.deleteOne({ userId, type })
  }
}

export default new OtpRepository()
