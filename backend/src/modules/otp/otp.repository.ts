import type { Types } from 'mongoose'
import type { IOtp, IOtpPersistence, OtpType } from './otp.types.js'
import Otp from './otp.model.js'

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

  async remove(id: string | Types.ObjectId, type: OtpType): Promise<DeleteResult> {
    return await Otp.deleteOne({ user: id, type })
  }
}

export default new OtpRepository()
