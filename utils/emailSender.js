import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendConfirmationEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  await transporter.sendMail({
    from: `"Tienda" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  });
};
