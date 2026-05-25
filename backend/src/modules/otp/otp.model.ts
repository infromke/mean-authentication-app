import type { IOtpDocument } from './otp.types.js'
import mongoose, { Schema } from 'mongoose'

const otpSchema = new Schema<IOtpDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'OTP code must be exactly 6 digits'],
    },
    type: {
      type: String,
      enum: {
        values: ['VERIFY', 'RESET'],
        message: '{VALUE} is not a valid OTP type',
      },
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > Date.now()
        },
        message: "An OTP's expiration date must be in the future",
      },
    },
  },
  { timestamps: true },
)

// adiciona um "Time-To-Live" que configura o MongoDB pra deletar automaticamente o documento
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// índice composto para previnir mais de um OTP ativo do mesmo TIPO (verify ou reset)
otpSchema.index({ userId: 1, type: 1 }, { unique: true })

const Otp = mongoose.model<IOtpDocument>('Otp', otpSchema)

export default Otp
