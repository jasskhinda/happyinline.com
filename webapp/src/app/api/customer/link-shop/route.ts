import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  console.log('=== Customer Link Shop API Called ===');

  try {
    const body = await request.json();
    const { userId, shopId, name, phone } = body;

    console.log('Request body:', { userId, shopId, name, phone: phone ? '***' : null });

    // Validate required fields
    if (!userId || !shopId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: userId, shopId' },
        { status: 400 }
      );
    }

    let adminClient;
    try {
      adminClient = createAdminClient();
      console.log('Admin client created successfully');
    } catch (adminError: any) {
      console.error('Failed to create admin client:', adminError.message);
      return NextResponse.json(
        { error: 'Server configuration error: ' + adminError.message },
        { status: 500 }
      );
    }

    // 1. Verify the shop exists and is approved
    console.log('Fetching shop:', shopId);
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .select('id, name, status')
      .eq('id', shopId)
      .single();

    console.log('Shop result:', { shop, error: shopError?.message });

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    if (shop.status !== 'approved') {
      console.log('Shop not approved, status:', shop.status);
      return NextResponse.json(
        { error: 'Shop is not currently accepting new customers' },
        { status: 403 }
      );
    }

    // 2. First check if profile exists
    console.log('Checking if profile exists for userId:', userId);
    const { data: existingProfile, error: checkError } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    console.log('Existing profile check:', { existingProfile, error: checkError?.message });

    // 3. Get user email from auth
    let userEmail = existingProfile?.email;

    // Always fetch from auth to ensure we have the email
    console.log('Fetching user from auth...');
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId);
    if (authError) {
      console.error('Error fetching auth user:', authError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use auth email if profile doesn't have one
    if (!userEmail && authUser?.user?.email) {
      userEmail = authUser.user.email;
    }
    console.log('User email:', userEmail);

    // Check if this email already exists under a different user ID
    // This catches the case where someone tries to sign up with an email that's already registered
    if (userEmail) {
      const { data: existingEmailProfiles, error: emailCheckError } = await adminClient
        .from('profiles')
        .select('id, email')
        .eq('email', userEmail.toLowerCase());

      console.log('Email check result:', { existingEmailProfiles, error: emailCheckError?.message });

      // Check if any profile with this email belongs to a different user
      const conflictingProfile = existingEmailProfiles?.find(p => p.id !== userId);
      if (conflictingProfile) {
        console.log('Email already exists under different user ID:', conflictingProfile.id);
        // This email is already registered - user should sign in with existing account
        return NextResponse.json(
          { error: 'This email is already registered. Please sign in with your existing account instead.' },
          { status: 409 }
        );
      }
    }

    // 4. Upsert the profile (create if doesn't exist, update if it does)
    const profileData: any = {
      id: userId,
      role: 'customer',
      exclusive_shop_id: shopId,
      email: userEmail?.toLowerCase(),
    };

    // Include name and phone if provided
    if (name) {
      profileData.name = name;
    }
    if (phone) {
      profileData.phone = phone;
    }

    console.log('Upserting profile with:', profileData);

    const { error: profileError, data: upsertResult } = await adminClient
      .from('profiles')
      .upsert(profileData, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    console.log('Profile upsert result:', { upsertResult, error: profileError?.message });

    if (profileError) {
      console.error('Error upserting profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to link customer to shop: ' + profileError.message },
        { status: 500 }
      );
    }

    // 5. Verify the update was successful
    const { data: updatedProfile, error: verifyError } = await adminClient
      .from('profiles')
      .select('exclusive_shop_id, role, name')
      .eq('id', userId)
      .single();

    console.log('Verification result:', { updatedProfile, error: verifyError?.message });

    if (verifyError || updatedProfile?.exclusive_shop_id !== shopId) {
      console.error('Profile update verification failed:', verifyError);
      return NextResponse.json(
        { error: 'Failed to verify customer link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Customer linked to ${shop.name}`,
      shopId: shopId,
      shopName: shop.name
    });

  } catch (error: any) {
    console.error('Customer link error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
