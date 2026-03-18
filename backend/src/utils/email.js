const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: `"Restaurant SaaS" <${config.email.from}>`,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    logger.error('Email send failed:', error.message);
    throw error;
  }
};

const emailTemplates = {
  verifyEmail: (name, link) => ({
    subject: 'Verify Your Email - Restaurant SaaS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Restaurant SaaS!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>Or copy this link: <a href="${link}">${link}</a></p>
        <p>This link expires in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  }),

  approvalNotification: (name, status) => ({
    subject: `Restaurant Registration ${status === 'approved' ? 'Approved' : 'Rejected'} - Restaurant SaaS`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${status === 'approved' ? '#16a34a' : '#dc2626'};">
          Registration ${status === 'approved' ? 'Approved' : 'Rejected'}
        </h2>
        <p>Hi ${name},</p>
        ${status === 'approved'
          ? '<p>Congratulations! Your restaurant registration has been approved. You can now log in and start managing your restaurant.</p>'
          : '<p>We regret to inform you that your restaurant registration has been rejected. Please contact support for more information.</p>'
        }
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Restaurant SaaS Platform</p>
      </div>
    `,
  }),

  resetPassword: (name, link) => ({
    subject: 'Reset Your Password - Restaurant SaaS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset Request</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>Or copy this link: <a href="${link}">${link}</a></p>
        <p>This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Restaurant SaaS Platform</p>
      </div>
    `,
  }),

  securityAlert: (name, action, ip) => ({
    subject: 'Security Alert - Restaurant SaaS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">⚠️ Security Alert</h2>
        <p>Hi ${name},</p>
        <p>We detected a security-related action on your account:</p>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>IP Address:</strong> ${ip || 'Unknown'}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p>If this wasn't you, please reset your password immediately.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #6b7280; font-size: 12px;">Restaurant SaaS Platform</p>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
