import env from '../../../config/env.js'
import type { MailOptions } from '../../../shared/types/mail.types.js'
import type { OtpType } from '../otp.types.js'
import getOtpEmailTemplate from '../templates/otpEmail.js'
import getWelcomeEmailTemplate from '../templates/welcomeEmail.js'

/**
 * Constrói a configuração e o conteúdo do e-mail para fluxos de autenticação OTP.
 * @param email O e-mail do destinatário.
 * @param code O código numérico gerado para a validação.
 * @param type O propósito do fluxo (verificação de conta ou redefinição de senha).
 * @returns A estrutura formatada pronta para consumo do Nodemailer.
 */
const getOtpMailOptions = (email: string, code: string, type: OtpType): MailOptions => {
  const isVerify = type === 'VERIFY'
  const typeText = isVerify ? 'verification' : 'password reset'

  return {
    from: env.SMTP_MAILER,
    to: email,
    subject: `Authentication System code: ${code}`,
    text: `Your ${typeText} code is:\n\n${code}\n\nThis code expires after 15 minutes. If you don't know what this is about, you are free to ignore it.`,
    html: getOtpEmailTemplate(typeText, code),
  }
}

/**
 * Constrói a configuração e a mensagem de boas-vindas para novos usuários registrados.
 * @param name O nome informado pelo usuário no cadastro.
 * @param email O e-mail de destino do usuário.
 * @returns A estrutura formatada pronta para consumo do Nodemailer.
 */
const getWelcomeMailOptions = (name: string, email: string): MailOptions => {
  const firstName = name.split(' ')[0]

  return {
    from: env.SMTP_MAILER,
    to: email,
    subject: 'Welcome to my Authentication System!',
    text: `Dear ${firstName},\n\nWelcome to a very simple website made with MongoDB, Express.js, Angular and Node.js!\n\nYou are receiving this message because you have created an account with the following e-mail: ${email}. If you don't know what this is about, you are free to ignore it.\n\nSincerely,\ninfromke (https://github.com/infromke)`,
    html: getWelcomeEmailTemplate(name, email),
  }
}

export { getOtpMailOptions, getWelcomeMailOptions }
