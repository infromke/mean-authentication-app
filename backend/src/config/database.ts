import mongoose from 'mongoose'

const connectToDb = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.DB_NAME as string,
    })
    console.log('[MONGODB] succesfully connected to the database\n')
  } catch (error: any) {
    console.log(`\n[MONGODB] failed to connect to the database:`, error.message)
  }
}

export default connectToDb
