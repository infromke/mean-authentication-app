import nodemailer from 'nodemailer'

export interface MailOptions {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PWD,
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
  } catch (error: any) {
    console.log('\n[NODEMAILER] failed to establish connection:', error.message)
  }
}

/**
 * Envia um e-mail com base nas opções estruturadas fornecidas.
 */
const sendEmail = async (mail: MailOptions): Promise<void> => {
  try {
    const info = await transporter.sendMail(mail)
    console.log('[NODEMAILER] sent an e-mail:', info.envelope)
  } catch (error: any) {
    console.log('\n[NODEMAILER] failed to send e-mail:', error.message)
  }
}

export { verifyConnection, sendEmail }
