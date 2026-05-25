import type { MailOptions } from '../config/nodemailer.js'
import type { OtpType } from '../modules/otp/otp.types.js'
import getOtpEmailTemplate from '../templates/otpEmail.js'
import getWelcomeEmailTemplate from '../templates/welcomeEmail.js'

/**
 * Gera o objeto de e-mail para fluxos de OTP (Verify ou Reset).
 * @param {string} email - E-mail do usuário.
 * @param {string} code - Código de OTP gerado.
 * @param {'VERIFY' | 'RESET'} type - Tipo do OTP.
 * @returns {Object} E-mail de código OTP estruturado.
 */
const getOtpMailOptions = (email: string, code: string, type: OtpType): MailOptions => {
  const isVerify = type === 'VERIFY'
  const typeText = isVerify ? 'verification' : 'password reset'

  return {
    from: process.env.SMTP_MAILER as string,
    to: email,
    subject: `Authentication System code: ${code}`,
    text: `Your ${typeText} code is:\n\n${code}\n\nThis code expires after 15 minutes. If you don't know what this is about, you are free to ignore it.`,
    html: getOtpEmailTemplate(typeText, code),
  }
}

/**
 * Gera o objeto de e-mail de boas-vindas.
 * @param {string} name - Nome do usuário.
 * @param {string} email - E-mail do usuário.
 * @returns {Object} E-mail de boas-vindas estruturado.
 */
const getWelcomeMailOptions = (name: string, email: string): MailOptions => {
  const firstName = name.split(' ')[0]

  return {
    from: process.env.SMTP_MAILER as string,
    to: email,
    subject: 'Welcome to my Authentication System!',
    text: `Dear ${firstName},\n\nWelcome to a very simple website made with MongoDB, Express.js, Angular and Node.js!\n\nYou are receiving this message because you have created an account with the following e-mail: ${email}. If you don't know what this is about, you are free to ignore it.\n\nSincerely,\ninfrmke (https://github.com/infrmke)`,
    html: getWelcomeEmailTemplate(name, email),
  }
}

export { getOtpMailOptions, getWelcomeMailOptions }
