# Happy InLine - Application Flow Documentation

## Overview
Happy InLine is a booking appointment system where customers are tied to ONE specific business (shop) - not a marketplace.

---

## User Roles & Flows

### 1. Business Owner Flow
1. **Create Account** → Register on website
2. **Pay Subscription** → Choose plan (Basic: 2 licenses, Professional: 5, Unlimited: unlimited)
3. **Create Store** → Set up business details (name, address, hours, services, etc.)
4. **Submit for Approval** → Store goes to "pending_review" status
5. **Wait for Super Admin Approval** → Super admin reviews and approves/rejects
6. **If Approved** → Business owner receives a **unique QR code** for their store
7. **Add Providers** → Add service providers (barbers, stylists, etc.) - each provider = 1 license
8. **Add Services** → Configure services with pricing
9. **Manage Bookings** → See customer bookings, approve/complete them
10. **Chat with Customers** → (Mobile app only) Message customers about their bookings

### 2. Customer Flow
1. **Scan QR Code** → Customer scans the business's unique QR code
2. **Sign Up/Login** → Creates account or logs in
3. **Store Becomes Their "Home"** → That ONE store is now their exclusive store
4. **Every Login** → Customer ONLY sees that one store - NO search, NO browsing other businesses
5. **Book Services** →
   - Select Service (e.g., "Hair Cut")
   - Select Provider (e.g., "John", "Mike")
   - Select Time
   - Confirm Booking
6. **View Bookings** → See their upcoming/past bookings
7. **Message Business** → (Mobile app only)

### 3. Super Admin Flow
1. **Review Pending Stores** → See all stores awaiting approval
2. **Approve/Reject** → Verify business legitimacy and approve or reject with reason
3. **Manage Platform** → Overall platform administration

---

## Key Concepts

### Licenses
- Each subscription plan has a `max_licenses` limit
- 1 License = 1 Service Provider (barber, stylist, etc.)
- Business owner can add providers up to their license limit

### QR Code System
- Each approved store gets a unique QR code
- Customers scan this QR code to "join" that store
- Customer is permanently linked to that ONE store
- No marketplace/search functionality for customers

### Store Exclusivity
- Customers do NOT browse multiple businesses
- Customers are tied to ONE store only
- The store they scanned becomes their "home"
- This is NOT a Yelp/marketplace model

---

## Platform Split (Mobile vs Web)

### Mobile App Handles:
- Customer booking flow
- Customer viewing their store
- Messaging between customer and business
- Push notifications

### Web App Handles:
- Business owner registration
- Subscription payment (to avoid Apple/Google fees)
- Provider management
- Service management
- Booking management
- Store creation and settings

---

## Database Key Fields

### profiles table
- `role`: 'owner' | 'customer' | 'provider' | 'super_admin'
- `subscription_plan`: 'none' | 'basic' | 'professional' | 'unlimited'
- `subscription_status`: 'active' | 'cancelled' | 'trial' | etc.
- `max_licenses`: number of providers allowed

### shops table
- `status`: 'draft' | 'pending_review' | 'active' | 'rejected'
- `qr_code`: unique QR code for customer scanning
- `owner_id`: links to business owner's profile

### Customer-Shop Link
- When customer scans QR, they get linked to that shop
- Customer profile stores their "home" shop ID
- Customer can only interact with that one shop

---

## What Customer Dashboard Should Show (Web)
Since customers primarily use the mobile app, the web customer page should:
1. Show their linked store info
2. Show their upcoming bookings
3. Link to download mobile app for full experience
4. NOT show search or browse functionality
