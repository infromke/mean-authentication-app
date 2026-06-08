import z from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['dev', 'development', 'production', 'test'], {
    message: 'NODE_ENV must be "dev", "development", "production" or "test"',
  }),
  SERVER_PORT: z.coerce.number().int().positive().default(3001),
  CLIENT_PORT: z.coerce.number().int().positive().default(4200),
  FRONTEND_URL: z.url('FRONTEND_URL must be a valid URL').optional(), // responsabilidade do Render
  MONGODB_URI: z
    .url('MONGODB_URI must be a valid connection URL')
    .min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters long'),
  JWT_RESET_SECRET: z.string().min(16, 'JWT_RESET_SECRET must be at least 16 characters long'),
  SMTP_MAILER: z.email('SMTP_USER must be a valid email address'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.email('SMTP_USER must be a valid email address'),
  SMTP_PWD: z.string().min(1, 'SMTP_PWD is required'),
})

// faz o parse das variáveis atuais do sistema
const envParse = envSchema.safeParse(process.env)

// exibe os erros no terminal se houver algum
if (!envParse.success) {
  console.error('[ENV] Invalid variables:')

  envParse.error.issues.forEach((issue) => {
    console.error(`${issue.path.join('.')}: ${issue.message}\n`)
  })

  process.exit(1)
}

// as variáveis estritamente tipadas estão aqui
const env = envParse.data

export default env
