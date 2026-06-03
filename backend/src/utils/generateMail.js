import otpEmail from '../templates/otpEmail.js'
import welcomeEmail from '../templates/welcomeEmail.js'

/**
 * Gera o objeto de e-mail para fluxos de OTP (Verify ou Reset).
 * @param {string} email - E-mail do usuário.
 * @param {string} code - Código de OTP gerado.
 * @param {'VERIFY' | 'RESET'} type - Tipo do OTP.
 * @returns {Object} E-mail estruturado.
 */
const getOtpMailOptions = (email, code, type) => {
  const isVerify = type === 'VERIFY'
  const typeText = isVerify ? 'verification' : 'password reset'

  return {
    from: process.env.SMTP_MAILER,
    to: email,
    subject: `Authentication System code: ${code}`,
    text: `Your ${typeText} code is:\n\n${code}\n\nThis code expires after 15 minutes. If you don't know what this is about, you are free to ignore it.`,
    html: otpEmail.replace('{{type}}', typeText).replaceAll('{{code}}', code),
  }
}

/**
 * Gera o objeto de e-mail de boas-vindas.
 * @param {string} name - Nome do usuário.
 * @param {string} email - E-mail do usuário.
 * @returns {Object} E-mail de boas-vindas estruturado.
 */
const getWelcomeMailOptions = (name, email) => {
  const firstName = name.split(' ')[0]

  return {
    from: process.env.SMTP_MAILER,
    to: email,
    subject: 'Welcome to my Authentication System!',
    text: `Dear ${firstName},\n\nWelcome to a very simple website made with MongoDB, Express.js, React and Node.js!\n\nYou are receiving this message because you have created an account with the following e-mail: ${email}. If you don't know what this is about, you are free to ignore it.\n\nSincerely,\ninfromke (https://github.com/infromke)`,
    html: welcomeEmail.replace('{{user}}', name).replace('{{email}}', email),
  }
}

export { getOtpMailOptions, getWelcomeMailOptions }
