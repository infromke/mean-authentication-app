import cors, { type CorsOptions } from 'cors'

const allowedOrigins = [
  process.env.CLIENT_PORT ? `http://localhost:${process.env.CLIENT_PORT}` : null,
  process.env.FRONTEND_URL || null, // o render irá injetar essa variável
].filter(Boolean) // filtra apenas os valores que não são "undefined"

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS!'))
    }
  },
  methods: 'GET,POST,PATCH,DELETE',
  credentials: true,
}

export default cors(corsOptions)
