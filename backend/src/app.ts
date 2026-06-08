import express, { type Request, type Response, type NextFunction } from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import connectToDb from './config/database.js'
import cors from './config/cors.js'
import { verifyConnection } from './config/nodemailer.js'
import GlobalRouter from './modules/index.routes.js'
import errorHandler from './middlewares/errorHandler.js'
import throwHttpError from './utils/throwHttpError.js'
import env from './config/env.js'

//  config
const app = express()

app.set('trust proxy', 1) // habilita o reconhecimento do IP real do usuário

connectToDb()
verifyConnection() // verifica a conexão do nodemailer

app.use(express.json())
app.use(cors)
app.use(cookieParser())

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

//  rotas
app.use(GlobalRouter)

//  middleware para rotas não encontradas (404)
app.use((_req: Request, _res: Response, _next: NextFunction) => {
  throw throwHttpError(404, 'Route not found')
})

//  middleware de erro global
app.use(errorHandler)

export default app
