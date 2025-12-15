import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, shopId, name, phone } = body;

    // Validate required fields
    if (!userId || !shopId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, shopId' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Verify the shop exists and is approved
    const { data: shop, error: shopError } = await adminClient
      .from('shops')
      .select('id, name, status')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    if (shop.status !== 'approved') {
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

    const { error: profileError } = await adminClient
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

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
      .select('exclusive_shop_id')
      .eq('id', userId)
      .single();

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
