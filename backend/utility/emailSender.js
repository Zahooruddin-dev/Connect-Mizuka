const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
});

const sendResetEmail = async (toEmail, resetCode) => {
  const mailOptions = {
    from: `"Mizuka Connect" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your Password Reset Code',
    html: `
      <div style="font-family: sans-serif; text-align: center;">
        <h2>Password Reset Request</h2>
        <p>Use the code below to reset your Mizuka account password:</p>
        <h1 style="color: #4A90E2;">${resetCode}</h1>
        <p>This code will expire soon. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendResetEmail };