require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
  console.log('Nodemailer version:', require('./node_modules/nodemailer/package.json').version);
  console.log('SMTP User:', process.env.SMTP_USER);

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  try {
    await transporter.verify();
    console.log('✅ SMTP connection works!');

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'IEEE Test Email',
      text: 'Email is working!'
    });
    console.log('✅ Test email sent! Check your inbox.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();