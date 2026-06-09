import type { MailOptions } from '../shared/types/mail.types.js'
import nodemailer from 'nodemailer'
import env from './env.js'

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PWD,
  },
  tls: {
    rejectUnauthorized: false, // força o nodemailer a confiar no servidor
  },
})

/**
 * Verifica se a configuração do transportador está correta e a conexão ativa.
 */
const verifyConnection = async (): Promise<void> => {
  try {
    await transporter.verify()
    console.log('[NODEMAILER] is ready to take messages')
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : '[NODEMAILER] Unknown error while verifying connection\n'
    console.log('\n[NODEMAILER] failed to establish connection:', errorMessage)
  }
}

/**
 * Envia um e-mail com base nas opções estruturadas fornecidas.
 */
const sendEmail = async (mail: MailOptions): Promise<void> => {
  try {
    const info = await transporter.sendMail(mail)
    console.log('[NODEMAILER] sent an e-mail:', info.envelope)
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : '[NODEMAILER] Unknown error while sending e-mail\n'
    console.log('\n[NODEMAILER] failed to send e-mail:', errorMessage)
  }
}

export { verifyConnection, sendEmail }
