# The Crafty Couple's Rewards - Product Requirements Document

## Original Problem Statement
Build an app that allows customers to use as a virtual rewards card. $10 spent = 1 punch. Reward tiers:
- 10 punches = 15% off
- 15 punches = 20% off
- 20 punches = 25% off

Customers sign up using phone or email, can view progress. Admin panel with PIN access to add punches per transaction.

## User Personas
1. **Customer**: Signs up with phone/email, views punch progress, sees available rewards
2. **Admin/Staff**: Logs in with PIN, adds punches for transactions, redeems rewards for customers

## Core Requirements
- Customer signup with name + phone/email
- Customer lookup by phone or email
- Visual punch card (20 punches)
- Total spending tracker per customer
- Reward tier system (10/15/20 punches)
- Admin PIN-protected access
- Transaction logging
- Rewards never expire

## What's Been Implemented (Jan 2026)
- ✅ Landing page with logo, reward tiers display
- ✅ Customer signup (name, phone, email)
- ✅ Customer lookup by phone/email
- ✅ Customer dashboard with punch card visual
- ✅ Total spending display per customer
- ✅ Admin PIN pad login (default PIN: 1234)
- ✅ Admin customer list with search
- ✅ Add punches via transaction amount
- ✅ Redeem rewards (15%, 20%, 25% off)
- ✅ Transaction history tracking
- ✅ Stats dashboard (total customers, revenue, active punches)
- ✅ Burgundy/gold/black theme matching logo

## Tech Stack
- Frontend: React with Tailwind CSS, Shadcn UI
- Backend: FastAPI (Python)
- Database: MongoDB
- Design: Custom theme matching The Crafty Couple branding

## Prioritized Backlog
### P0 (Critical)
- (All critical features implemented)

### P1 (High Priority)
- Customer email/SMS notifications when rewards available
- QR code for quick customer lookup

### P2 (Nice to Have)
- Export customer data to CSV
- Analytics dashboard with charts
- Multiple staff PIN codes
- Appointment/order integration

## Next Tasks
1. Add customer notifications (email/SMS)
2. Generate QR codes for customer cards
3. Add data export functionality
