const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  const missingConfig = !host || !user || !pass || Number.isNaN(port);
  if (missingConfig) {
    console.warn('Email skipped: SMTP environment variables are not fully configured.');
    return;
  }

  // Render and similar hosts cannot use localhost SMTP unless you run an SMTP service there.
  if (process.env.NODE_ENV === 'production' && ['127.0.0.1', 'localhost'].includes(host)) {
    console.warn('Email skipped: EMAIL_HOST points to localhost in production.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    connectionTimeout: 10000,
  });

  const message = {
    from: `${user}`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  await transporter.sendMail(message);
};

module.exports = sendEmail;

