import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, generateProviderPassword } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

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

    // 3. Check if user already exists
    const { data: existingUser } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('email', email.toLowerCase())
      .single();

    let userId: string;
    let generatedPassword: string | null = null;

    if (existingUser) {
      // User already exists - just add them to shop_staff
      userId = existingUser.id;

      // Check if already a provider at this shop
      const { data: existingStaff } = await adminClient
        .from('shop_staff')
        .select('id')
        .eq('shop_id', shopId)
        .eq('user_id', userId)
        .single();

      if (existingStaff) {
        return NextResponse.json(
          { error: 'This user is already a provider at your business' },
          { status: 400 }
        );
      }
    } else {
      // 4. Create new user account with generated password
      generatedPassword = generateProviderPassword();

      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: email.toLowerCase(),
        password: generatedPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: name,
          phone: phone || null
        }
      });

      if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError);
        return NextResponse.json(
          { error: authError?.message || 'Failed to create user account' },
          { status: 500 }
        );
      }

      userId = authUser.user.id;

      // 5. Update the profile that was auto-created by Supabase trigger
      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: profileError } = await adminClient
        .from('profiles')
        .update({
          name: name,
          phone: phone || null,
          role: 'barber' // 'barber' is the valid role for providers in the database constraint
        })
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        // Try to clean up auth user
        await adminClient.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: 'Failed to create provider profile: ' + profileError.message },
          { status: 500 }
        );
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
      return NextResponse.json(
        { error: 'Failed to add provider to shop' },
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
      generatedPassword, // null if existing user
      isNewUser: generatedPassword !== null,
      message: generatedPassword
        ? `Provider account created. Temporary password: ${generatedPassword}`
        : 'Existing user added as provider'
    });

  } catch (error: any) {
    console.error('Provider creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
