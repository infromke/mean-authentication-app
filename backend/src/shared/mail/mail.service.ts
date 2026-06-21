import nodemailer from 'nodemailer'

import env from '../../config/env.js'

import type { MailOptions, MailOtpType } from './mail.types.js'
import getOtpEmailTemplate from './templates/otpEmail.js'
import getWelcomeEmailTemplate from './templates/welcomeEmail.js'

class MailService {
  #transporter = nodemailer.createTransport({
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
  verifyConnection = async (): Promise<void> => {
    try {
      await this.#transporter.verify()
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
  #sendEmail = async (mail: MailOptions): Promise<void> => {
    try {
      const info = await this.#transporter.sendMail(mail)
      console.log('[NODEMAILER] sent an e-mail:', info.envelope)
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : '[NODEMAILER] Unknown error while sending e-mail\n'
      console.log('\n[NODEMAILER] failed to send e-mail:', errorMessage)
    }
  }

  /**
   * Constrói e envia o e-mail de autenticação OTP.
   */
  sendOtpEmail = async (email: string, code: string, type: MailOtpType): Promise<void> => {
    const mailOptions: MailOptions = {
      from: env.SMTP_MAILER,
      to: email,
      subject: `Authentication System code: ${code}`,
      text: `Your ${type} code is:\n\n${code}\n\nThis code expires after 15 minutes. If you don't know what this is about, you are free to ignore it.`,
      html: getOtpEmailTemplate(type, code),
    }

    await this.#sendEmail(mailOptions)
  }

  /**
   * Constrói e envia a mensagem de boas-vindas para novos usuários.
   */
  sendWelcomeEmail = async (name: string, email: string): Promise<void> => {
    const firstName = name.split(' ')[0]

    const mailOptions: MailOptions = {
      from: env.SMTP_MAILER,
      to: email,
      subject: 'Welcome to my Authentication System!',
      text: `Dear ${firstName},\n\nWelcome to a very simple website made with MongoDB, Express.js, Angular and Node.js!\n\nYou are receiving this message because you have created an account with the following e-mail: ${email}. If you don't know what this is about, you are free to ignore it.\n\nSincerely,\ninfromke (https://github.com/infromke)`,
      html: getWelcomeEmailTemplate(name, email),
    }

    await this.#sendEmail(mailOptions)
  }
}

export default new MailService()
