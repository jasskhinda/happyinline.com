import { NextRequest, NextResponse } from 'next/server';
import { sendOTPEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase-admin';

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP storage (in production, use Redis or database)
// Format: { [email]: { otp: string, expiresAt: Date, userId: string } }
const otpStore = new Map<string, { otp: string; expiresAt: Date; userId: string; newEmail?: string }>();

// Clean up expired OTPs periodically
setInterval(() => {
  const now = new Date();
  for (const [email, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 60000); // Clean every minute

// POST /api/auth/otp - Send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, userId, otp, newEmail } = body;

    if (action === 'send') {
      // Send OTP to email
      if (!email || !userId) {
        return NextResponse.json(
          { error: 'Email and userId are required' },
          { status: 400 }
        );
      }

      // Generate new OTP
      const generatedOTP = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP
      otpStore.set(userId, {
        otp: generatedOTP,
        expiresAt,
        userId,
        newEmail: newEmail || email
      });

      // Send OTP email
      const result = await sendOTPEmail(
        newEmail || email,
        generatedOTP,
        newEmail ? 'email_change' : 'verification'
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to send OTP email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'OTP sent successfully'
      });
    }

    if (action === 'verify') {
      // Verify OTP
      if (!userId || !otp) {
        return NextResponse.json(
          { error: 'userId and otp are required' },
          { status: 400 }
        );
      }

      const storedData = otpStore.get(userId);

      if (!storedData) {
        return NextResponse.json(
          { error: 'No OTP found. Please request a new code.' },
          { status: 400 }
        );
      }

      if (storedData.expiresAt < new Date()) {
        otpStore.delete(userId);
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new code.' },
          { status: 400 }
        );
      }

      if (storedData.otp !== otp) {
        return NextResponse.json(
          { error: 'Invalid OTP. Please check and try again.' },
          { status: 400 }
        );
      }

      // OTP is valid - if this is an email change, update the email
      if (storedData.newEmail) {
        const supabase = createAdminClient();

        // Update email in auth.users
        const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
          email: storedData.newEmail.toLowerCase().trim()
        });

        if (authError) {
          console.error('Error updating auth email:', authError);
          return NextResponse.json(
            { error: 'Failed to update email: ' + authError.message },
            { status: 500 }
          );
        }

        // Update email in profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ email: storedData.newEmail.toLowerCase().trim() })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile email:', profileError);
          // Don't fail - auth email was updated
        }
      }

      // Clear the OTP
      otpStore.delete(userId);

      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        newEmail: storedData.newEmail
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "send" or "verify".' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in OTP API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
