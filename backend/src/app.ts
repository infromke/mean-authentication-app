import cookieParser from 'cookie-parser'
import express, { type NextFunction, type Request, type Response } from 'express'
import morgan from 'morgan'
import cors from './config/cors.js'
import connectToDb from './config/database.js'
import env from './config/env.js'
import { verifyConnection } from './config/nodemailer.js'
import GlobalRouter from './modules/routes.js'
import AppError from './shared/errors/AppError.js'
import errorHandler from './shared/middlewares/errorHandler.js'

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
  throw new AppError(404, 'Route not found')
})

//  middleware de erro global
app.use(errorHandler)

export default app
