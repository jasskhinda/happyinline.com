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

interface BookingEmailData {
  customerName: string;
  customerEmail: string;
  ownerName?: string;
  ownerEmail?: string;
  providerName?: string;
  providerEmail?: string;
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  services: { name: string; price: number; duration: number }[];
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
  const servicesHTML = data.services
    .map(s => `<li style="margin-bottom: 8px;">${s.name} - $${s.price.toFixed(2)} (${s.duration} min)</li>`)
    .join('');

  const greeting = recipientType === 'customer'
    ? `Hi ${data.customerName},`
    : recipientType === 'owner'
    ? `Hi ${data.ownerName || 'Business Owner'},`
    : `Hi ${data.providerName || 'Provider'},`;

  const intro = recipientType === 'customer'
    ? 'Your appointment has been confirmed! Here are your booking details:'
    : 'You have a new booking! Here are the details:';

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
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #09264b 0%, #0a3a6b 100%); padding: 30px; text-align: center; border-radius: 16px 16px 0 0;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Happy InLine</h1>
      <p style="color: #0393d5; margin: 10px 0 0 0; font-size: 14px;">Skip the wait. Join the line.</p>
    </div>

    <!-- Content -->
    <div style="background: #ffffff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h2 style="color: #09264b; margin: 0 0 10px 0; font-size: 22px;">
        ${recipientType === 'customer' ? 'Booking Confirmed!' : 'New Booking!'}
      </h2>

      <p style="color: #666; margin: 0 0 25px 0; font-size: 16px;">
        ${greeting}<br><br>
        ${intro}
      </p>

      <!-- Booking Details Card -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #0393d5; padding-bottom: 10px;">
          Appointment Details
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
          ` : ''}
        </table>
      </div>

      <!-- Services -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #0393d5; padding-bottom: 10px;">
          Services Booked
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #09264b;">
          ${servicesHTML}
        </ul>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
          <strong style="color: #09264b; font-size: 18px;">Total: $${data.totalAmount.toFixed(2)}</strong>
        </div>
      </div>

      ${data.customerNotes ? `
      <!-- Notes -->
      <div style="background: #fff3cd; border-radius: 12px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
        <strong style="color: #856404;">Customer Notes:</strong>
        <p style="color: #856404; margin: 5px 0 0 0;">${data.customerNotes}</p>
      </div>
      ` : ''}

      ${data.shopAddress ? `
      <!-- Location -->
      <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="color: #09264b; margin: 0 0 10px 0; font-size: 18px;">Location</h3>
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
      <p style="margin: 5px 0 0 0;">Skip the wait. Join the line.</p>
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

export default transporter;
