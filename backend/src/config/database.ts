import mongoose from 'mongoose'
import env from './env.js'

const connectToDb = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.DB_NAME,
    })
    console.log('[MONGODB] succesfully connected to the database\n')
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : '[MONGODB] Unknown error while connecting to database\n'
    console.log(`\n[MONGODB] failed to connect to the database:`, errorMessage)
  }
}

export default connectToDb
