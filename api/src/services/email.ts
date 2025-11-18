import { createTransport } from 'nodemailer';

// Email configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || 'otpsender77@gmail.com';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'UniCraft Solutions';

// Create transporter
const transporter = createTransport(SMTP_CONFIG);

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service configuration error:', error);
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for school registration
 */
export const sendVerificationOTP = async (
  email: string,
  schoolName: string,
  otp: string
): Promise<void> => {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Verify Your Email - UniCraft School Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo h1 {
            color: #667eea;
            margin: 0;
            font-size: 32px;
          }
          .otp-box {
            background: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo">
              <h1>🎓 UniCraft</h1>
              <p style="color: #6c757d; margin: 0;">School Portal</p>
            </div>
            
            <h2 style="color: #333; margin-top: 0;">Welcome, ${schoolName}!</h2>
            
            <p>Thank you for registering with UniCraft School Portal. To complete your registration, please verify your email address using the OTP below:</p>
            
            <div class="otp-box">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">Your Verification Code</p>
              <div class="otp-code">${otp}</div>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Valid for 10 minutes</p>
            </div>
            
            <p>Enter this code on the verification page to activate your account and start managing your school's ID cards.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>This OTP is valid for 10 minutes only</li>
                <li>Do not share this code with anyone</li>
                <li>If you didn't request this, please ignore this email</li>
              </ul>
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact our support team.</p>
            
            <div class="footer">
              <p><strong>UniCraft Solutions</strong></p>
              <p>Simplifying School ID Card Management</p>
              <p style="font-size: 12px; color: #adb5bd;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to UniCraft School Portal!

Hello ${schoolName},

Thank you for registering with UniCraft. To complete your registration, please verify your email address using the OTP below:

Your Verification Code: ${otp}

This code is valid for 10 minutes.

Enter this code on the verification page to activate your account.

Security Notice:
- This OTP is valid for 10 minutes only
- Do not share this code with anyone
- If you didn't request this, please ignore this email

Best regards,
UniCraft Solutions Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification OTP sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send welcome email after successful verification
 */
/**
 * Send temporary password email
 */
export const sendTemporaryPasswordEmail = async (
  email: string,
  schoolName: string,
  temporaryPassword: string
): Promise<void> => {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Your Temporary Password - UniCraft School Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .logo h1 {
            color: #667eea;
            text-align: center;
            margin: 0 0 10px 0;
            font-size: 32px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo">
              <h1>🎓 UniCraft</h1>
              <p style="color: #6c757d; text-align: center; margin: 0;">School Portal</p>
            </div>
            
            <h2 style="color: #333;">Your Temporary Password</h2>
            
            <p>Hello ${schoolName},</p>
            
            <p>We received a request to reset your password. Here is your temporary password:</p>
            
            <div style="background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">Your Temporary Password</p>
              <div style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; margin: 10px 0; font-family: monospace;">
                ${temporaryPassword}
              </div>
              <p style="margin: 0; color: #6c757d; font-size: 12px;">Use this to login</p>
            </div>
            
            <p><strong>How to use:</strong></p>
            <ol style="line-height: 1.8;">
              <li>Go to the login page</li>
              <li>Enter your email: <strong>${email}</strong></li>
              <li>Enter the temporary password above</li>
              <li>You'll be prompted to change your password after login</li>
            </ol>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                <li>Change this password immediately after logging in</li>
                <li>Do not share this password with anyone</li>
                <li>If you didn't request this, please contact support</li>
              </ul>
            </div>
            
            <div class="footer">
              <p><strong>UniCraft Solutions</strong></p>
              <p>Simplifying School ID Card Management</p>
              <p style="font-size: 12px; color: #adb5bd;">
                This is an automated email. Please do not reply to this message.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Your Temporary Password - UniCraft School Portal

Hello ${schoolName},

We received a request to reset your password. Here is your temporary password:

${temporaryPassword}

How to use:
1. Go to the login page
2. Enter your email: ${email}
3. Enter the temporary password above
4. You'll be prompted to change your password after login

Security Notice:
- Change this password immediately after logging in
- Do not share this password with anyone
- If you didn't request this, please contact support

Best regards,
UniCraft Solutions Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Temporary password email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send temporary password email:', error);
    throw new Error('Failed to send temporary password email');
  }
};

/**
 * Generate a random temporary password
 */
export const generateTemporaryPassword = (): string => {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%'[Math.floor(Math.random() * 5)]; // Special char
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (
  email: string,
  schoolName: string
): Promise<void> => {
  const mailOptions = {
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: email,
    subject: 'Welcome to UniCraft School Portal! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            padding: 30px;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .logo h1 {
            color: #667eea;
            text-align: center;
            margin: 0 0 10px 0;
            font-size: 32px;
          }
          .feature-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #667eea;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #6c757d;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="logo">
              <h1>🎓 UniCraft</h1>
              <p style="color: #6c757d; text-align: center; margin: 0;">School Portal</p>
            </div>
            
            <h2 style="color: #333;">Welcome, ${schoolName}! 🎉</h2>
            
            <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
            
            <p>You can now access all features of the UniCraft School Portal:</p>
            
            <div class="feature-box">
              <strong>✨ What you can do:</strong>
              <ul style="margin: 10px 0 0 0;">
                <li>Add and manage student records</li>
                <li>Upload student photos</li>
                <li>Submit batch requests for ID cards</li>
                <li>Track submission status</li>
                <li>Update school profile and logo</li>
              </ul>
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">
                Login to Your Dashboard
              </a>
            </div>
            
            <p style="margin-top: 30px;">If you need any help getting started, our support team is here to assist you.</p>
            
            <div class="footer">
              <p><strong>UniCraft Solutions</strong></p>
              <p>Simplifying School ID Card Management</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to UniCraft School Portal!

Hello ${schoolName},

Congratulations! Your email has been successfully verified and your account is now active.

You can now access all features of the UniCraft School Portal:
- Add and manage student records
- Upload student photos
- Submit batch requests for ID cards
- Track submission status
- Update school profile and logo

Login to your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/login

Best regards,
UniCraft Solutions Team
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send welcome email:', error);
    // Don't throw error for welcome email failure
  }
};

