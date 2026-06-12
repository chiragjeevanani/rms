const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  let transporter;
  let fromEmail = process.env.EMAIL_USER || 'no-reply@rms.com';

  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    // Verify connection configuration
    await transporter.verify();
  } catch (authError) {
    console.warn(`⚠️ Configured SMTP credentials failed (${authError.message}). Falling back to Ethereal SMTP...`);
    
    // Generate temporary Ethereal account
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    fromEmail = `no-reply@rms.com`;
  }

  const mailOptions = {
    from: `"RMS Operations" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`✉ Ethereal Test Email sent successfully!`);
    console.log(`🔗 Preview URL: ${previewUrl}`);
  } else {
    console.log(`✉ Email sent successfully to ${options.email}`);
  }
};

module.exports = sendEmail;
