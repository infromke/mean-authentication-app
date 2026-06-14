import cors, { type CorsOptions } from 'cors'

import env from './env.js'

const allowedOrigins = [
  `http://localhost:${env.CLIENT_PORT}`, // front-end local
  env.FRONTEND_URL, // URL de produção injetada pelo Render
].filter((origin): origin is string => Boolean(origin))

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
