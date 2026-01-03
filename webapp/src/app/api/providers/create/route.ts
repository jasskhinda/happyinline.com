import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, generateProviderPassword } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ownerId, name, email, phone } = body;

    // Validate required fields
    if (!shopId || !ownerId || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: shopId, ownerId, name, email' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Check if owner has available licenses
    const { data: ownerProfile, error: ownerError } = await adminClient
      .from('profiles')
      .select('max_licenses, subscription_status')
      .eq('id', ownerId)
      .single();

    if (ownerError || !ownerProfile) {
      return NextResponse.json(
        { error: 'Owner profile not found' },
        { status: 404 }
      );
    }

    if (ownerProfile.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 403 }
      );
    }

    // 2. Count current providers for this shop
    const { count: currentProviders, error: countError } = await adminClient
      .from('shop_staff')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('is_active', true);

    if (countError) {
      return NextResponse.json(
        { error: 'Failed to check provider count' },
        { status: 500 }
      );
    }

    const maxLicenses = ownerProfile.max_licenses || 0;
    if ((currentProviders || 0) >= maxLicenses) {
      return NextResponse.json(
        { error: `License limit reached (${maxLicenses}). Upgrade your plan to add more providers.` },
        { status: 403 }
      );
    }

    // 3. Check if user already exists in profiles table
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, role, name')
      .eq('email', normalizedEmail)
      .single();

    let userId: string;
    let generatedPassword: string | null = null;
    let isNewUser = false;

    if (existingProfile) {
      // User already exists in our system
      userId = existingProfile.id;

      // Check if already a provider at this shop
      const { data: existingStaff } = await adminClient
        .from('shop_staff')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single();

      if (existingStaff) {
        return NextResponse.json(
          { error: `This email (${normalizedEmail}) is already registered as a provider at your business.` },
          { status: 400 }
        );
      }

      // User exists but not a provider at this shop - add them
      // No password generated for existing users
    } else {
      // User doesn't exist in profiles - check if they exist in auth.users
      // This can happen if they started signup but didn't complete it
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(
        u => u.email?.toLowerCase() === normalizedEmail
      );

      if (existingAuthUser) {
        // Auth user exists but no profile - this is an incomplete signup
        // We'll use their existing auth account and create/update their profile
        userId = existingAuthUser.id;

        // Create or update their profile
        const { error: upsertError } = await adminClient
          .from('profiles')
          .upsert({
            id: userId,
            email: normalizedEmail,
            name: name,
            phone: phone || null,
            role: 'barber'
          });

        if (upsertError) {
          console.error('Error upserting profile:', upsertError);
          return NextResponse.json(
            { error: 'Failed to create provider profile. Please try again.' },
            { status: 500 }
          );
        }

        // Generate a new password for them since they may not have completed signup
        generatedPassword = generateProviderPassword();

        // Update their password
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          { password: generatedPassword }
        );

        if (updateError) {
          console.error('Error updating user password:', updateError);
          // Continue anyway - they might be able to use password reset
        } else {
          isNewUser = true;
        }
      } else {
        // 4. Create new user account with generated password
        generatedPassword = generateProviderPassword();
        isNewUser = true;

        const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
          email: normalizedEmail,
          password: generatedPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name: name,
            phone: phone || null
          }
        });

        if (authError || !authUser.user) {
          console.error('Error creating auth user:', authError);

          // Check if it's a duplicate email error
          if (authError?.message?.includes('already been registered') ||
              authError?.message?.includes('already exists')) {
            return NextResponse.json(
              { error: `An account with email ${normalizedEmail} already exists. Please use a different email.` },
              { status: 400 }
            );
          }

          return NextResponse.json(
            { error: authError?.message || 'Failed to create user account' },
            { status: 500 }
          );
        }

        userId = authUser.user.id;

        // 5. Wait for profile trigger, then update
        await new Promise(resolve => setTimeout(resolve, 500));

        const { error: profileError } = await adminClient
          .from('profiles')
          .update({
            name: name,
            phone: phone || null,
            role: 'barber'
          })
          .eq('id', userId);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          // Try to clean up auth user
          await adminClient.auth.admin.deleteUser(userId);
          return NextResponse.json(
            { error: 'Failed to create provider profile. Please try again.' },
            { status: 500 }
          );
        }
      }
    }

    // 6. Add to shop_staff
    const { error: staffError } = await adminClient
      .from('shop_staff')
      .insert({
        shop_id: shopId,
        user_id: userId,
        role: 'barber',
        is_active: true,
        is_available: true
      });

    if (staffError) {
      console.error('Error adding to shop_staff:', staffError);

      // Check for duplicate
      if (staffError.message?.includes('duplicate') || staffError.code === '23505') {
        return NextResponse.json(
          { error: 'This provider is already registered at your business.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to add provider to shop. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Update owner's license_count
    const newProviderCount = (currentProviders || 0) + 1;
    await adminClient
      .from('profiles')
      .update({ license_count: newProviderCount })
      .eq('id', ownerId);

    // 8. Return success with generated password (only for new users)
    return NextResponse.json({
      success: true,
      userId,
      generatedPassword: isNewUser ? generatedPassword : null,
      isNewUser,
      message: isNewUser && generatedPassword
        ? `Provider account created successfully!`
        : 'Existing user added as provider'
    });

  } catch (error: any) {
    console.error('Provider creation error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
