import nodemailer from 'nodemailer';

export class OTPService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Only initialize transporter if email credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  }

  // Generate 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP via email
  async sendOTPEmail(email: string, otp: string, firstName: string): Promise<boolean> {
    try {
      // In development mode without email config, just log the OTP
      if (!this.transporter) {
        console.log(`\n🔐 DEV MODE - OTP for ${email}: ${otp}`);
        console.log(`📧 Email would be sent to: ${firstName} <${email}>`);
        console.log(`⏰ OTP expires in 10 minutes\n`);
        return true;
      }

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'ReVeda - Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Welcome to ReVeda!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up with ReVeda. Please use the following OTP to verify your account:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #333; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>This OTP will expire in 10 minutes.</p>
            <p>If you didn't create an account with ReVeda, please ignore this email.</p>
            <br>
            <p>Best regards,<br>ReVeda Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`📧 OTP email sent successfully to ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending OTP email:', error);
      return false;
    }
  }

  // Send OTP via SMS (Mock implementation - integrate with SMS service like Twilio)
  async sendOTPSMS(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Mock SMS sending - replace with actual SMS service
      console.log(`📱 SMS OTP sent to ${phoneNumber}: ${otp}`);
      
      // For production, integrate with services like:
      // - Twilio
      // - AWS SNS
      // - MSG91
      // - TextLocal
      
      return true;
    } catch (error) {
      console.error('Error sending OTP SMS:', error);
      return false;
    }
  }

  // Verify OTP expiry (10 minutes)
  isOTPExpired(otpExpiry: Date): boolean {
    return new Date() > otpExpiry;
  }

  // Get OTP expiry time (10 minutes from now)
  getOTPExpiry(): Date {
    return new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  }
}

export default new OTPService();