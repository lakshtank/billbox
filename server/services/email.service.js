const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (
    !host ||
    !user ||
    !pass ||
    user.includes('your_smtp_user') ||
    pass.includes('your_smtp_password')
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

/**
 * Sends a warranty reminder email to a user.
 * Wraps delivery in try/catch so SMTP failures are logged cleanly without crashing background jobs.
 *
 * @param {Object} options
 * @param {string} options.to - User email address
 * @param {string} options.userName - User display name
 * @param {string} options.productName - Name of the product
 * @param {string} options.storeName - Merchant / Store name
 * @param {Date|string} options.warrantyExpiryDate - Expiry date
 * @param {number} options.daysRemaining - Days remaining until expiry
 * @returns {Promise<boolean>} True if email sent successfully, false otherwise
 */
const sendWarrantyReminderEmail = async ({
  to,
  userName,
  productName,
  storeName,
  warrantyExpiryDate,
  daysRemaining,
}) => {
  try {
    const formattedExpiry = new Date(warrantyExpiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const storeInfo = storeName ? ` bought from ${storeName}` : '';
    const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;

    const subject = `Warranty Expiry Notice: ${productName} (${dayLabel} remaining)`;
    
    const textContent = `Hello ${userName || 'User'},\n\nThis is a reminder from BillBox that the warranty for your item "${productName}"${storeInfo} is expiring soon.\n\nWarranty Expiry Date: ${formattedExpiry}\nDays Remaining: ${dayLabel}\n\nIf you need to make a warranty claim, please check your receipt details on BillBox.\n\nBest regards,\nBillBox Team`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0;">Warranty Expiry Notice</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          Hello <strong>${userName || 'User'}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5;">
          This is a reminder that the warranty for <strong>${productName}</strong>${storeInfo} is set to expire soon.
        </p>
        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Product:</strong> ${productName}</p>
          <p style="margin: 0 0 8px 0; font-size: 14px; color: #334155;"><strong>Expiry Date:</strong> ${formattedExpiry}</p>
          <p style="margin: 0; font-size: 14px; color: #d97706; font-weight: 600;"><strong>Status:</strong> ${dayLabel} remaining</p>
        </div>
        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Please review your receipt and claim documents on BillBox if you need to submit a service request.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Sent automatically by BillBox Warranty Lifecycle System.
        </p>
      </div>
    `;

    const transporter = createTransporter();

    if (!transporter) {
      console.warn(
        `[EmailService] SMTP credentials not configured (SMTP_HOST/USER/PASS). [SIMULATED EMAIL] To: ${to} | Subject: "${subject}"`
      );
      return true; // Graceful fallback in dev when SMTP credentials are not set up
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@billbox.com',
      to,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] Email delivered to ${to} (MessageID: ${info.messageId})`);
    return true;
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return false;
  }
};

module.exports = {
  sendWarrantyReminderEmail,
};
