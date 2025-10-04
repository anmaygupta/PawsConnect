// import nodemailer from 'nodemailer'; // Replaced with secure Replit Mail integration
import type { DogReport, User } from '@shared/schema';
import { sendEmail } from '../utils/replitmail';

// Using secure Replit Mail integration instead of hardcoded SMTP
// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || 'smtp.gmail.com',
//   port: parseInt(process.env.SMTP_PORT || '587'),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

export class EmailService {
  static async sendFoundDogNotification(
    lostDogReport: DogReport,
    foundDogReport: DogReport,
    ownerUser: User,
    finderUser: User
  ): Promise<void> {
    const subject = `🐕 Possible Match Found for ${lostDogReport.dogName || 'Your Dog'}!`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🐾 Paw Finder Alert</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">Great News! A Possible Match Has Been Found</h2>
          
          <p>Hello ${ownerUser.firstName || 'Pet Owner'},</p>
          
          <p>Someone has reported finding a dog that might match your lost pet <strong>${lostDogReport.dogName || 'your dog'}</strong>!</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #1f2937; margin-top: 0;">Found Dog Details:</h3>
            <p><strong>Breed:</strong> ${foundDogReport.breed}</p>
            <p><strong>Size:</strong> ${foundDogReport.size}</p>
            <p><strong>Color:</strong> ${foundDogReport.primaryColor}</p>
            <p><strong>Gender:</strong> ${foundDogReport.gender}</p>
            <p><strong>Found Location:</strong> ${foundDogReport.lastSeenLocation}</p>
            <p><strong>Found Date:</strong> ${foundDogReport.lastSeenDate.toLocaleDateString()}</p>
            <p><strong>Description:</strong> ${foundDogReport.description}</p>
          </div>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="color: #1f2937; margin-top: 0;">Finder Contact Information:</h3>
            <p><strong>Name:</strong> ${foundDogReport.contactName}</p>
            <p><strong>Phone:</strong> ${foundDogReport.contactPhone}</p>
            <p><strong>Email:</strong> ${foundDogReport.contactEmail}</p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Contact the finder using the information above</li>
            <li>Arrange a safe meeting in a public place</li>
            <li>Bring identification and photos of your pet</li>
            <li>If it's your dog, please update your report status on Paw Finder</li>
          </ol>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View on Paw Finder
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Safety Tips:</strong><br>
            • Meet in a well-lit, public location<br>
            • Bring a friend if possible<br>
            • Trust your instincts<br>
            • Verify the dog's identity with photos, microchip, or other identifying features
          </p>
        </div>
        
        <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p>This email was sent by Paw Finder - Reuniting Lost Dogs with Their Families</p>
          <p>If this is not your dog, please disregard this message.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: lostDogReport.contactEmail,
      subject,
      html: htmlContent,
    });
  }

  static async sendReportConfirmation(report: DogReport, user: User): Promise<void> {
    const subject = `${report.type === 'lost' ? '🚨 Lost' : '✅ Found'} Dog Report Confirmed - ${report.dogName || 'Unnamed Dog'}`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #f97316 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🐾 Paw Finder</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9fafb;">
          <h2 style="color: #1f2937;">Report Submitted Successfully</h2>
          
          <p>Hello ${user.firstName || 'User'},</p>
          
          <p>Thank you for submitting a ${report.type} dog report. Your report is now active and visible to the community.</p>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${report.type === 'lost' ? '#ef4444' : '#10b981'};">
            <h3 style="color: #1f2937; margin-top: 0;">${report.type === 'lost' ? 'Lost' : 'Found'} Dog Details:</h3>
            <p><strong>Name:</strong> ${report.dogName || 'Not provided'}</p>
            <p><strong>Breed:</strong> ${report.breed}</p>
            <p><strong>Size:</strong> ${report.size}</p>
            <p><strong>Color:</strong> ${report.primaryColor}</p>
            <p><strong>Location:</strong> ${report.lastSeenLocation}</p>
            <p><strong>ZIP Code:</strong> ${report.zipCode}</p>
            ${report.rewardAmount ? `<p><strong>Reward:</strong> $${report.rewardAmount}</p>` : ''}
          </div>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>Your report is now visible to users searching in your area</li>
            <li>You'll receive email alerts if matching reports are found</li>
            <li>Continue to share your report on social media and local community groups</li>
            <li>Check back regularly for updates and potential matches</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Your Report
            </a>
          </div>
        </div>
        
        <div style="background: #374151; color: white; padding: 20px; text-align: center; font-size: 14px;">
          <p>Paw Finder - Reuniting Lost Dogs with Their Families</p>
          <p>Don't lose hope - we're here to help bring your pet home safely.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: report.contactEmail,
      subject,
      html: htmlContent,
    });
  }
}
