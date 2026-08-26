import nodemailer from 'nodemailer'
import type { H3Event } from 'h3'

export async function sendOtpEmail(event: H3Event, email: string, name: string, code: string) {
  const config = useRuntimeConfig(event)
  const smtp = config.smtp

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: Number(smtp.port) || 587,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  })

  await transporter.sendMail({
    from: smtp.from || smtp.user,
    to: email,
    subject: 'Your LeadsAgri Bootcamp verification code',
    text: `Hi ${name},\n\nYour verification code is ${code}. It expires in 5 minutes.\n\nIf you did not request this code, you can ignore this email.\n\n— LeadsAgri Partner Bootcamp`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h1 style="font-size: 18px; color: #18181b;">Hi ${name},</h1>
        <p style="color: #3f3f46;">Enter this code to continue to the LeadsAgri Partner Bootcamp tracker:</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #16a34a; margin: 24px 0;">${code}</p>
        <p style="color: #71717a; font-size: 13px;">This code expires in 5 minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `
  })
}
