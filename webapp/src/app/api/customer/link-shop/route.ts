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

    // 2. Update the customer's profile with exclusive_shop_id
    const updateData: any = {
      role: 'customer',
      exclusive_shop_id: shopId,
    };

    // Include name and phone if provided
    if (name) {
      updateData.name = name;
    }
    if (phone) {
      updateData.phone = phone;
    }

    console.log('Updating profile with:', updateData);

    const { error: profileError, data: updateResult } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select();

    console.log('Profile update result:', { updateResult, error: profileError?.message });

    if (profileError) {
      console.error('Error updating profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to link customer to shop: ' + profileError.message },
        { status: 500 }
      );
    }

    // 3. Verify the update was successful
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
