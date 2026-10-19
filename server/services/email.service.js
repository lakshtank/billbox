const nodemailer = require('nodemailer');

let cachedEthereal = null;

const createTransporter = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (
    host &&
    user &&
    pass &&
    !user.includes('your_smtp_user') &&
    !pass.includes('your_smtp_password')
  ) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      }),
      isLive: true,
      from: process.env.EMAIL_FROM || user,
    };
  }

  // Active Ethereal test account for verifiable test dispatch when SMTP is not configured
  if (!cachedEthereal) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedEthereal = {
        transporter: nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        }),
        isLive: false,
        isEthereal: true,
        from: `"BillBox Vault" <${testAccount.user}>`,
      };
      console.log(`[EmailService] Initialized Ethereal test mailer: ${testAccount.user}`);
    } catch (err) {
      console.warn('[EmailService] Could not create Ethereal test account:', err.message);
      return null;
    }
  }

  return cachedEthereal;
};

const renderWarrantyEmailHtml = ({
  userName,
  productName,
  storeName,
  warrantyExpiryDate,
  daysRemaining,
}) => {
  const formattedExpiry = new Date(warrantyExpiryDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const storeInfo = storeName ? ` bought from ${storeName}` : '';
  const dayLabel = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`;

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
        <span style="font-size: 20px; font-weight: 800; color: #23778E; letter-spacing: -0.5px;">BillBox</span>
        <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; background-color: #e0f2fe; color: #0369a1; text-transform: uppercase;">Warranty Shield</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px;">Warranty Expiry Milestone Notice</h2>
      <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-top: 0;">
        Hello <strong>${userName || 'Valued User'}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        This is an automated priority alert from your BillBox Vault. The official manufacturer warranty for <strong>${productName}</strong>${storeInfo} is approaching its expiration deadline.
      </p>
      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Product:</strong> ${productName}</p>
        ${storeName ? `<p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Merchant / Store:</strong> ${storeName}</p>` : ''}
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;"><strong>Official Expiry Date:</strong> ${formattedExpiry}</p>
        <p style="margin: 0; font-size: 15px; color: ${daysRemaining <= 7 ? '#dc2626' : daysRemaining <= 30 ? '#d97706' : '#2563eb'}; font-weight: 700;">
          <strong>Timeline Status:</strong> ${dayLabel} remaining
        </p>
      </div>
      <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
        <strong>Recommended Action:</strong> Inspect your device or hardware for any faults, performance degradation, or battery wear. Submit free repair or replacement claims with your original invoice before coverage terminates.
      </p>
      <div style="margin: 24px 0 12px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/warranties" style="display: inline-block; padding: 10px 20px; background-color: #23778E; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; border-radius: 8px;">
          View Warranty in BillBox
        </a>
      </div>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
      <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
        You received this notification because proactive warranty reminders are active on your BillBox account. Manage notification intervals in your BillBox Reminder Center.
      </p>
    </div>
  `;
};

/**
 * Sends a warranty reminder email to a user.
 * Wraps delivery in try/catch and supports simulated dev delivery when SMTP credentials are not present.
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
    const subject = `[BillBox] Warranty Expiry Notice: ${productName} (${dayLabel} remaining)`;
    
    const textContent = `Hello ${userName || 'User'},\n\nThis is an automated alert from your BillBox Vault. The warranty for "${productName}"${storeInfo} is expiring in ${dayLabel}.\n\nWarranty Expiry Date: ${formattedExpiry}\n\nPlease check your receipt in BillBox to claim free repairs or service before coverage lapses.\n\nBest regards,\nBillBox Team`;

    const htmlContent = renderWarrantyEmailHtml({
      userName,
      productName,
      storeName,
      warrantyExpiryDate,
      daysRemaining,
    });

    const transportInfo = await createTransporter();

    if (!transportInfo) {
      console.log(
        `[EmailService] Simulation Mode (SMTP unconfigured): Warranty reminder email generated for ${to} | Subject: "${subject}"`
      );
      return {
        delivered: true,
        reason: 'simulated',
        isLive: false,
        isSimulated: true,
        messageId: `sim-${Date.now()}`,
        html: htmlContent,
      };
    }

    const { transporter, isLive, isEthereal, from } = transportInfo;

    const mailOptions = {
      from,
      to,
      subject,
      text: textContent,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;

    if (previewUrl) {
      console.log(`[EmailService] Ethereal delivery url: ${previewUrl}`);
    } else {
      console.log(`[EmailService] Live email dispatched to ${to} (MessageID: ${info.messageId})`);
    }

    return {
      delivered: true,
      reason: isLive ? 'sent' : 'ethereal',
      isLive: Boolean(isLive),
      isSimulated: !isLive,
      previewUrl,
      messageId: info.messageId,
      html: htmlContent,
    };
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
    return { delivered: false, reason: 'failed', error: error.message };
  }
};

module.exports = {
  sendWarrantyReminderEmail,
  renderWarrantyEmailHtml,
};
