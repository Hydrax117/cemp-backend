import nodemailer from "nodemailer";

async function resetPasswordEmail(email, token, baseUrl) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST, // your email provider's host
      port: process.env.EMAIL_PORT, // your email provider's port
      secure: false, // provider's requirements
      auth: {8
        user: process.env.EMAIL_USER, // your email address
        pass: process.env.EMAIL_PASSWORD // your email password
      }
    });

    const resetUrl = `${baseUrl}/reset-password/${token}`; // Build the reset URL

    const mailOptions = {
      from: '"React community Project" <react.community.project@gmail.com>', // Replace with your app name and email
      to: email,
      subject: 'Password Reset Request',
      text: `You requested a password reset for your account. Please click the following link to reset your password:\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email.`,
      html: `<b>You requested a password reset for your account.</b><br><p>Please click the following link to reset your password:</p><a href="${resetUrl}">Reset Password</a><br><p>If you did not request a password reset, please ignore this email.</p>`
    };

    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
  } catch (error) {
    console.error('Error sending password reset email:', error);
  }
}
