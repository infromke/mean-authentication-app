import type { Types } from 'mongoose'
import Otp, { type IOtp, type IOtpPersistence } from './otp.model.js'
import type { OtpType } from './otp.types.js'

// para operações de deleção
interface DeleteResult {
  acknowledged: boolean
  deletedCount: number
}

class OtpRepository {
  /**
   * Insere um novo registro de OTP no banco e retorna sua estrutura em POJO.
   */
  async create(data: Partial<IOtp>): Promise<IOtpPersistence> {
    const otp = await Otp.create(data)
    return otp.toObject() as IOtpPersistence // converte para objeto JS puro
  }

  /**
   * Localiza um documento OTP ativo por meio do ID do usuário atrelado a si e o tipo de OTP.
   */
  async findById(id: string | Types.ObjectId, type: OtpType): Promise<IOtpPersistence | null> {
    return await Otp.findOne({
      userId: id,
      type,
      expiresAt: { $gt: new Date() },
    }).lean<IOtpPersistence | null>()
  }

  /**
   * Exclui um documento OTP de acordo com seu tipo e o ID de usuário associado a ele.
   */
  async deleteOne(userId: string | Types.ObjectId, type: OtpType): Promise<DeleteResult> {
    return await Otp.deleteOne({ userId, type })
  }
}

export default new OtpRepository()
