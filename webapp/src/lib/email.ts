import nodemailer from 'nodemailer';

// SendPulse SMTP Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp-pulse.com',
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER || 'webdeveloperandesigner@gmail.com',
    pass: process.env.SMTP_PASS || 'bCfETsBWFFSakEp',
  },
});

interface ServiceWithOnlineInfo {
  name: string;
  price: number;
  duration: number;
  service_type?: 'in_person' | 'online' | 'both';
  chosen_format?: 'in_person' | 'online';
  online_meeting_link?: string;
  online_meeting_password?: string;
  online_instructions?: string;
}

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  ownerName?: string;
  ownerEmail?: string;
  providerName?: string;
  providerEmail?: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  services: ServiceWithOnlineInfo[];
  appointmentDate: string;
  appointmentTime: string;
  totalAmount: number;
  customerNotes?: string;
  bookingId: string;
}

// Format date for display (e.g., "Friday, January 27, 2026")
const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format time for display (e.g., "2:30 PM")
const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Generate HTML email template
const generateBookingEmailHTML = (
  data: BookingEmailData,
  recipientType: 'customer' | 'owner' | 'provider'
): string => {
  // Determine effective format for each service
  const getEffectiveFormat = (s: ServiceWithOnlineInfo): 'in_person' | 'online' => {
    if (s.chosen_format) return s.chosen_format;
    if (s.service_type === 'online') return 'online';
    return 'in_person';
  };

  // Debug logging
  console.log('📧 Email template - services data:', data.services.map(s => ({
    name: s.name,
    chosen_format: s.chosen_format,
    service_type: s.service_type,
    effectiveFormat: getEffectiveFormat(s),
    online_meeting_link: s.online_meeting_link
  })));

  // Separate services by format
  const onlineServices = data.services.filter(s => getEffectiveFormat(s) === 'online');
  const inPersonServices = data.services.filter(s => getEffectiveFormat(s) === 'in_person');
  const hasOnlineServices = onlineServices.length > 0;
  const hasInPersonServices = inPersonServices.length > 0;
  const hasOnlineMeetingLinks = onlineServices.some(s => s.online_meeting_link);

  console.log('📧 Email template - hasOnlineServices:', hasOnlineServices, 'hasInPersonServices:', hasInPersonServices, 'recipientType:', recipientType);

  // Generate services HTML with format badges
  const servicesHTML = data.services
    .map(s => {
      const format = getEffectiveFormat(s);
      const formatBadge = format === 'online'
        ? '<span style="display: inline-block; background: #8b5cf6; color: #ffffff; font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; vertical-align: middle;">📹 Online</span>'
        : '<span style="display: inline-block; background: #10b981; color: #ffffff; font-size: 10px; padding: 2px 8px; border-radius: 10px; margin-left: 8px; vertical-align: middle;">📍 In-Person</span>';
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
          <div>
            <span style="color: #09264b; font-weight: 500;">${s.name}</span>
            ${formatBadge}
            <div style="color: #888; font-size: 12px; margin-top: 4px;">${s.duration} min</div>
          </div>
          <span style="color: #09264b; font-weight: 600;">$${s.price.toFixed(2)}</span>
        </div>
      `;
    })
    .join('');

  const greeting = recipientType === 'customer'
    ? `Hi ${data.customerName},`
    : recipientType === 'owner'
    ? `Hi ${data.ownerName || 'Business Owner'},`
    : `Hi ${data.providerName || 'Provider'},`;

  const intro = recipientType === 'customer'
    ? 'Your appointment has been confirmed! Here are your booking details:'
    : 'You have a new booking! Here are the details:';

  // Logo URL - using absolute URL for email clients
  const logoUrl = 'https://www.happyinline.com/logo.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation - Happy InLine</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #09264b 0%, #0a3a6b 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <img src="${logoUrl}" alt="Happy InLine" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #09264b; margin: 0 0 10px 0; font-size: 22px;">
        ${recipientType === 'customer' ? '🎉 Booking Confirmed!' : '📅 New Booking!'}
      </h2>

      <p style="color: #666; margin: 0 0 25px 0; font-size: 16px;">
        ${greeting}<br><br>
        ${intro}
      </p>

      <!-- Booking Details Card -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #0393d5; padding-bottom: 10px;">
          📋 Appointment Details
        </h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Date</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${formatDate(data.appointmentDate)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Time</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${formatTime(data.appointmentTime)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Business</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.shopName}
            </td>
          </tr>
          ${data.providerName ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Provider</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.providerName}
            </td>
          </tr>
          ` : ''}
          ${recipientType !== 'customer' ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.customerName}
            </td>
          </tr>
          ${data.customerPhone ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Customer Phone</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              <a href="tel:${data.customerPhone}" style="color: #0393d5; text-decoration: none;">📞 ${data.customerPhone}</a>
            </td>
          </tr>
          ` : ''}
          ` : ''}
        </table>
      </div>

      <!-- Services with Format Badges -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #0393d5; padding-bottom: 10px;">
          ✨ Services Booked
        </h3>
        ${servicesHTML}
        <div style="margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #09264b; font-size: 18px;">Total</strong>
          <strong style="color: #0393d5; font-size: 20px;">$${data.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      ${data.customerNotes ? `
      <!-- Notes -->
      <div style="background: #fff3cd; border-radius: 12px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <strong style="color: #856404;">📝 Customer Notes:</strong>
        <p style="color: #856404; margin: 5px 0 0 0;">${data.customerNotes}</p>
      </div>
      ` : ''}

      ${hasOnlineServices ? `
      <!-- Online Meeting Section - JOIN NOW (shown to all recipients) -->
      <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 20px; text-align: center;">
          📹 Your Online Session
        </h3>
        ${onlineServices.map(s => `
        <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; margin-bottom: ${onlineServices.indexOf(s) < onlineServices.length - 1 ? '15px' : '0'};">
          <p style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">${s.name}</p>

          ${s.online_meeting_link ? `
          <!-- JOIN NOW Button -->
          <div style="text-align: center; margin-bottom: 20px;">
            <a href="${s.online_meeting_link}"
               style="display: inline-block; background: #ffffff; color: #8b5cf6; font-size: 18px; font-weight: 700; text-decoration: none; padding: 15px 40px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
              🚀 JOIN NOW
            </a>
          </div>

          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">Meeting Link</p>
            <p style="color: #ffffff; font-size: 13px; margin: 0; word-break: break-all;">${s.online_meeting_link}</p>
          </div>
          ` : `
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px;">
            <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; text-align: center;">
              Meeting details will be provided by ${data.shopName}
            </p>
          </div>
          `}

          ${s.online_meeting_password ? `
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-top: 10px;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">🔐 Password</p>
            <p style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0; font-family: monospace; letter-spacing: 2px;">${s.online_meeting_password}</p>
          </div>
          ` : ''}

          ${s.online_instructions ? `
          <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 15px; margin-top: 10px;">
            <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px;">📋 Instructions</p>
            <p style="color: #ffffff; font-size: 14px; margin: 0; line-height: 1.6;">${s.online_instructions}</p>
          </div>
          ` : ''}
        </div>
        `).join('')}
        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 20px 0 0 0; text-align: center;">
          ${hasOnlineMeetingLinks ? '⏰ Please join the meeting a few minutes before your scheduled time.' : '⏰ The business will contact you with meeting details before your appointment.'}
        </p>
      </div>
      ` : ''}

      ${hasInPersonServices ? `
      <!-- In-Person Section - shown to all recipients -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 25px; margin-bottom: 20px;">
        <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 20px; text-align: center;">
          📍 In-Person Appointment
        </h3>
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="display: inline-block; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 16px; font-weight: 600; padding: 12px 30px; border-radius: 25px;">
            ✅ BE READY
          </span>
        </div>
        ${data.shopAddress ? `
        <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Location</p>
          <p style="color: #ffffff; font-size: 16px; font-weight: 500; margin: 0;">${data.shopAddress}</p>
          ${data.shopPhone ? `
          <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 10px 0 0 0;">
            📞 ${data.shopPhone}
          </p>
          ` : ''}
        </div>
        ` : ''}
        <p style="color: rgba(255,255,255,0.8); font-size: 13px; margin: 20px 0 0 0; text-align: center;">
          Please arrive 5-10 minutes before your scheduled time.
        </p>
      </div>
      ` : ''}

      ${!hasInPersonServices && data.shopAddress ? `
      <!-- Location (for owner/provider view or if no in-person section shown) -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 10px 0; font-size: 18px;">📍 Location</h3>
        <p style="color: #666; margin: 0;">${data.shopAddress}</p>
        ${data.shopPhone ? `<p style="color: #666; margin: 5px 0 0 0;">Phone: ${data.shopPhone}</p>` : ''}
      </div>
      ` : ''}

      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          ${recipientType === 'customer'
            ? 'Need to make changes? Contact the business directly.'
            : 'Log in to your dashboard to manage this booking.'}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Happy InLine. All rights reserved.</p>
      <p style="margin: 5px 0 0 0; color: #0393d5;">Skip the wait. Join the line.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send booking confirmation email to customer
export const sendCustomerBookingEmail = async (data: BookingEmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.customerEmail,
      subject: `Booking Confirmed - ${data.shopName}`,
      html: generateBookingEmailHTML(data, 'customer'),
    });
    console.log(`✅ Customer email sent to ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send customer email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking notification email to owner
export const sendOwnerBookingEmail = async (data: BookingEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.ownerEmail) {
    return { success: false, error: 'No owner email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.ownerEmail,
      subject: `New Booking - ${data.customerName} on ${formatDate(data.appointmentDate)}`,
      html: generateBookingEmailHTML(data, 'owner'),
    });
    console.log(`✅ Owner email sent to ${data.ownerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send owner email:', error);
    return { success: false, error: error.message };
  }
};

// Send booking notification email to provider
export const sendProviderBookingEmail = async (data: BookingEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.providerEmail) {
    return { success: false, error: 'No provider email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.providerEmail,
      subject: `New Booking Assigned - ${data.customerName} on ${formatDate(data.appointmentDate)}`,
      html: generateBookingEmailHTML(data, 'provider'),
    });
    console.log(`✅ Provider email sent to ${data.providerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send provider email:', error);
    return { success: false, error: error.message };
  }
};

// Send all booking notification emails
export const sendBookingNotifications = async (data: BookingEmailData): Promise<{
  customerSent: boolean;
  ownerSent: boolean;
  providerSent: boolean;
}> => {
  const results = await Promise.all([
    sendCustomerBookingEmail(data),
    sendOwnerBookingEmail(data),
    data.providerEmail ? sendProviderBookingEmail(data) : Promise.resolve({ success: false }),
  ]);

  return {
    customerSent: results[0].success,
    ownerSent: results[1].success,
    providerSent: results[2].success,
  };
};

// ============================================
// CANCELLATION EMAIL FUNCTIONS
// ============================================

interface CancellationEmailData {
  customerName: string;
  customerEmail: string;
  ownerName?: string;
  ownerEmail?: string;
  providerName?: string;
  providerEmail?: string;
  shopName: string;
  services: { name: string; price: number; duration: number }[];
  appointmentDate: string;
  appointmentTime: string;
  totalAmount: number;
  cancelledBy: 'customer' | 'business';
  bookingId: string;
}

// Generate cancellation email HTML
const generateCancellationEmailHTML = (
  data: CancellationEmailData,
  recipientType: 'customer' | 'owner' | 'provider'
): string => {
  const servicesHTML = data.services
    .map(s => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
        <div>
          <span style="color: #09264b; font-weight: 500;">${s.name}</span>
          <div style="color: #888; font-size: 12px; margin-top: 4px;">${s.duration} min</div>
        </div>
        <span style="color: #09264b; font-weight: 600;">$${s.price.toFixed(2)}</span>
      </div>
    `)
    .join('');

  const greeting = recipientType === 'customer'
    ? `Hi ${data.customerName},`
    : recipientType === 'owner'
    ? `Hi ${data.ownerName || 'Business Owner'},`
    : `Hi ${data.providerName || 'Provider'},`;

  const cancelMessage = data.cancelledBy === 'customer'
    ? recipientType === 'customer'
      ? 'Your appointment has been cancelled as requested.'
      : `${data.customerName} has cancelled their appointment.`
    : recipientType === 'customer'
      ? 'Your appointment has been cancelled by the business.'
      : 'The following appointment has been cancelled.';

  const logoUrl = 'https://www.happyinline.com/logo.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Cancelled - Happy InLine</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <img src="${logoUrl}" alt="Happy InLine" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #dc2626; margin: 0 0 10px 0; font-size: 22px;">
        ❌ Appointment Cancelled
      </h2>

      <p style="color: #666; margin: 0 0 25px 0; font-size: 16px;">
        ${greeting}<br><br>
        ${cancelMessage}
      </p>

      <!-- Cancelled Appointment Details -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #dc2626;">
        <h3 style="color: #991b1b; margin: 0 0 15px 0; font-size: 18px;">
          📋 Cancelled Appointment Details
        </h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Date</td>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600; font-size: 14px; text-align: right; text-decoration: line-through;">
              ${formatDate(data.appointmentDate)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Time</td>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600; font-size: 14px; text-align: right; text-decoration: line-through;">
              ${formatTime(data.appointmentTime)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Business</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.shopName}
            </td>
          </tr>
          ${recipientType !== 'customer' ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.customerName}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Services -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">
          Services
        </h3>
        ${servicesHTML}
        <div style="margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #09264b; font-size: 18px;">Total</strong>
          <strong style="color: #888; font-size: 20px; text-decoration: line-through;">$${data.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          ${recipientType === 'customer'
            ? 'We hope to see you again soon! Book a new appointment anytime.'
            : 'This booking slot is now available for new appointments.'}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Happy InLine. All rights reserved.</p>
      <p style="margin: 5px 0 0 0; color: #0393d5;">Skip the wait. Join the line.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send cancellation notification to customer
export const sendCustomerCancellationEmail = async (data: CancellationEmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.customerEmail,
      subject: `Appointment Cancelled - ${data.shopName}`,
      html: generateCancellationEmailHTML(data, 'customer'),
    });
    console.log(`✅ Cancellation email sent to customer ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send customer cancellation email:', error);
    return { success: false, error: error.message };
  }
};

// Send cancellation notification to owner
export const sendOwnerCancellationEmail = async (data: CancellationEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.ownerEmail) {
    return { success: false, error: 'No owner email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.ownerEmail,
      subject: `Booking Cancelled - ${data.customerName} on ${formatDate(data.appointmentDate)}`,
      html: generateCancellationEmailHTML(data, 'owner'),
    });
    console.log(`✅ Cancellation email sent to owner ${data.ownerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send owner cancellation email:', error);
    return { success: false, error: error.message };
  }
};

// Send cancellation notification to provider
export const sendProviderCancellationEmail = async (data: CancellationEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.providerEmail) {
    return { success: false, error: 'No provider email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.providerEmail,
      subject: `Booking Cancelled - ${data.customerName} on ${formatDate(data.appointmentDate)}`,
      html: generateCancellationEmailHTML(data, 'provider'),
    });
    console.log(`✅ Cancellation email sent to provider ${data.providerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send provider cancellation email:', error);
    return { success: false, error: error.message };
  }
};

// Send all cancellation notification emails
export const sendCancellationNotifications = async (data: CancellationEmailData): Promise<{
  customerSent: boolean;
  ownerSent: boolean;
  providerSent: boolean;
}> => {
  const results = await Promise.all([
    sendCustomerCancellationEmail(data),
    sendOwnerCancellationEmail(data),
    data.providerEmail ? sendProviderCancellationEmail(data) : Promise.resolve({ success: false }),
  ]);

  return {
    customerSent: results[0].success,
    ownerSent: results[1].success,
    providerSent: results[2].success,
  };
};

// ============================================
// RESCHEDULE EMAIL FUNCTIONS
// ============================================

interface RescheduleEmailData {
  customerName: string;
  customerEmail: string;
  ownerName?: string;
  ownerEmail?: string;
  providerName?: string;
  providerEmail?: string;
  shopName: string;
  shopAddress?: string;
  services: { name: string; price: number; duration: number }[];
  oldDate: string;
  oldTime: string;
  newDate: string;
  newTime: string;
  totalAmount: number;
  rescheduledBy: 'customer' | 'business';
  bookingId: string;
}

// Generate reschedule email HTML
const generateRescheduleEmailHTML = (
  data: RescheduleEmailData,
  recipientType: 'customer' | 'owner' | 'provider'
): string => {
  const servicesHTML = data.services
    .map(s => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #eee;">
        <div>
          <span style="color: #09264b; font-weight: 500;">${s.name}</span>
          <div style="color: #888; font-size: 12px; margin-top: 4px;">${s.duration} min</div>
        </div>
        <span style="color: #09264b; font-weight: 600;">$${s.price.toFixed(2)}</span>
      </div>
    `)
    .join('');

  const greeting = recipientType === 'customer'
    ? `Hi ${data.customerName},`
    : recipientType === 'owner'
    ? `Hi ${data.ownerName || 'Business Owner'},`
    : `Hi ${data.providerName || 'Provider'},`;

  const rescheduleMessage = data.rescheduledBy === 'business'
    ? recipientType === 'customer'
      ? 'Your appointment has been rescheduled by the business. Please see the new details below.'
      : 'The following appointment has been rescheduled.'
    : recipientType === 'customer'
      ? 'Your appointment has been rescheduled as requested.'
      : `${data.customerName} has rescheduled their appointment.`;

  const logoUrl = 'https://www.happyinline.com/logo.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Rescheduled - Happy InLine</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <img src="${logoUrl}" alt="Happy InLine" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #d97706; margin: 0 0 10px 0; font-size: 22px;">
        🔄 Appointment Rescheduled
      </h2>

      <p style="color: #666; margin: 0 0 25px 0; font-size: 16px;">
        ${greeting}<br><br>
        ${rescheduleMessage}
      </p>

      <!-- Date Change Highlight -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 2px solid #f59e0b;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
          <!-- Old Date -->
          <div style="text-align: center; flex: 1; min-width: 150px;">
            <p style="color: #92400e; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase;">Previous</p>
            <p style="color: #78350f; font-size: 14px; margin: 0; text-decoration: line-through; opacity: 0.7;">
              ${formatDate(data.oldDate)}<br>${formatTime(data.oldTime)}
            </p>
          </div>

          <!-- Arrow -->
          <div style="color: #d97706; font-size: 24px;">→</div>

          <!-- New Date -->
          <div style="text-align: center; flex: 1; min-width: 150px;">
            <p style="color: #15803d; font-size: 12px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">New Date</p>
            <p style="color: #166534; font-size: 16px; margin: 0; font-weight: 700;">
              ${formatDate(data.newDate)}<br>${formatTime(data.newTime)}
            </p>
          </div>
        </div>
      </div>

      <!-- Appointment Details -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
          📋 Appointment Details
        </h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">New Date</td>
            <td style="padding: 8px 0; color: #15803d; font-weight: 600; font-size: 14px; text-align: right;">
              ${formatDate(data.newDate)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">New Time</td>
            <td style="padding: 8px 0; color: #15803d; font-weight: 600; font-size: 14px; text-align: right;">
              ${formatTime(data.newTime)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Business</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.shopName}
            </td>
          </tr>
          ${recipientType !== 'customer' ? `
          <tr>
            <td style="padding: 8px 0; color: #888; font-size: 14px;">Customer</td>
            <td style="padding: 8px 0; color: #09264b; font-weight: 600; font-size: 14px; text-align: right;">
              ${data.customerName}
            </td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Services -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #0393d5; padding-bottom: 10px;">
          ✨ Services
        </h3>
        ${servicesHTML}
        <div style="margin-top: 15px; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #09264b; font-size: 18px;">Total</strong>
          <strong style="color: #0393d5; font-size: 20px;">$${data.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      ${data.shopAddress ? `
      <!-- Location -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 10px 0; font-size: 18px;">📍 Location</h3>
        <p style="color: #666; margin: 0;">${data.shopAddress}</p>
      </div>
      ` : ''}

      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          ${recipientType === 'customer'
            ? 'Please update your calendar with the new date and time.'
            : 'The booking has been updated in your dashboard.'}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Happy InLine. All rights reserved.</p>
      <p style="margin: 5px 0 0 0; color: #0393d5;">Skip the wait. Join the line.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send reschedule notification to customer
export const sendCustomerRescheduleEmail = async (data: RescheduleEmailData): Promise<{ success: boolean; error?: string }> => {
  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.customerEmail,
      subject: `Appointment Rescheduled - ${data.shopName} - ${formatDate(data.newDate)}`,
      html: generateRescheduleEmailHTML(data, 'customer'),
    });
    console.log(`✅ Reschedule email sent to customer ${data.customerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send customer reschedule email:', error);
    return { success: false, error: error.message };
  }
};

// Send reschedule notification to owner
export const sendOwnerRescheduleEmail = async (data: RescheduleEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.ownerEmail) {
    return { success: false, error: 'No owner email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.ownerEmail,
      subject: `Booking Rescheduled - ${data.customerName} - New: ${formatDate(data.newDate)}`,
      html: generateRescheduleEmailHTML(data, 'owner'),
    });
    console.log(`✅ Reschedule email sent to owner ${data.ownerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send owner reschedule email:', error);
    return { success: false, error: error.message };
  }
};

// Send reschedule notification to provider
export const sendProviderRescheduleEmail = async (data: RescheduleEmailData): Promise<{ success: boolean; error?: string }> => {
  if (!data.providerEmail) {
    return { success: false, error: 'No provider email provided' };
  }

  try {
    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: data.providerEmail,
      subject: `Booking Rescheduled - ${data.customerName} - New: ${formatDate(data.newDate)}`,
      html: generateRescheduleEmailHTML(data, 'provider'),
    });
    console.log(`✅ Reschedule email sent to provider ${data.providerEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send provider reschedule email:', error);
    return { success: false, error: error.message };
  }
};

// Send all reschedule notification emails
export const sendRescheduleNotifications = async (data: RescheduleEmailData): Promise<{
  customerSent: boolean;
  ownerSent: boolean;
  providerSent: boolean;
}> => {
  const results = await Promise.all([
    sendCustomerRescheduleEmail(data),
    sendOwnerRescheduleEmail(data),
    data.providerEmail ? sendProviderRescheduleEmail(data) : Promise.resolve({ success: false }),
  ]);

  return {
    customerSent: results[0].success,
    ownerSent: results[1].success,
    providerSent: results[2].success,
  };
};

// Generate OTP email HTML
const generateOTPEmailHTML = (otp: string, purpose: 'email_change' | 'verification'): string => {
  const title = purpose === 'email_change' ? 'Email Change Verification' : 'Email Verification';
  const message = purpose === 'email_change'
    ? 'You requested to change your email address. Please use the code below to verify your new email:'
    : 'Please use the code below to verify your email address:';

  const logoUrl = 'https://www.happyinline.com/logo.png';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Happy InLine</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #09264b 0%, #0a3a6b 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <img src="${logoUrl}" alt="Happy InLine" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #09264b; margin: 0 0 10px 0; font-size: 22px;">${title}</h2>

      <p style="color: #666; margin: 0 0 25px 0; font-size: 16px;">
        ${message}
      </p>

      <!-- OTP Code -->
      <div style="background: linear-gradient(135deg, #09264b 0%, #0a3a6b 100%); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 25px;">
        <p style="color: #0393d5; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px;">Your Verification Code</p>
        <p style="color: #ffffff; font-size: 40px; font-weight: bold; margin: 0; letter-spacing: 8px;">${otp}</p>
      </div>

      <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
        This code will expire in <strong>10 minutes</strong>.
      </p>

      <p style="color: #888; font-size: 14px; margin: 0;">
        If you didn't request this code, please ignore this email.
      </p>

      <!-- Footer Message -->
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 14px; margin: 0;">
          Need help? Contact our support team.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #888; font-size: 12px;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} Happy InLine. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">Skip the wait. Join the line.</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send OTP verification email
export const sendOTPEmail = async (
  email: string,
  otp: string,
  purpose: 'email_change' | 'verification' = 'verification'
): Promise<{ success: boolean; error?: string }> => {
  try {
    const subject = purpose === 'email_change'
      ? 'Verify Your New Email Address - Happy InLine'
      : 'Email Verification Code - Happy InLine';

    await transporter.sendMail({
      from: '"Happy InLine" <noreply@happyinline.com>',
      to: email,
      subject,
      html: generateOTPEmailHTML(otp, purpose),
    });
    console.log(`✅ OTP email sent to ${email}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Failed to send OTP email:', error);
    return { success: false, error: error.message };
  }
};

export default transporter;
