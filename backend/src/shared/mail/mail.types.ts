export interface MailOptions {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

export type MailOtpType = 'verification' | 'password reset'
