# u-bike Platform

Premium motorbike ride-hailing and errands platform for African markets.

## Monorepo Structure

```
ubike/
├── apps/
│   ├── customer/          Flutter app — Customer ride & errand booking
│   ├── rider-passenger/   Flutter app — Passenger boda boda riders
│   ├── rider-errands/     Flutter app — Errands delivery riders
│   └── admin/             Next.js admin dashboard
├── backend/
│   └── api/               Express.js + TypeScript REST API
├── database/
│   └── schema.sql         Complete Supabase PostgreSQL schema
└── render.yaml            Render deployment config
```

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile Apps | Flutter (Dart) + Material Design 3 |
| Admin Dashboard | Next.js 14 + TypeScript + Tailwind |
| Backend API | Express.js + TypeScript + Clean Architecture |
| Database | Supabase (PostgreSQL + RLS + Realtime) |
| Auth | JWT + Phone OTP via Africa's Talking |
| Payments | Paystack (escrow-style) |
| Maps | OpenStreetMap + OpenRouteService |
| Voice Calls | ZEGOCLOUD |
| Realtime | Socket.IO + Supabase Realtime |

## Brand Colors

- **Charcoal** `#2E2B26` — Primary background
- **Gold** `#BF9340` — Primary interactive / brand
- **Burnt Sienna** `#8B2E1E` — Accent / errands

## Quick Start

### Backend API

```bash
cd backend/api
cp .env.example .env   # fill in secrets
npm install
npm run dev            # http://localhost:3001
```

### Admin Dashboard

```bash
cd apps/admin
npm install
npm run dev            # http://localhost:3000
```

### Customer Flutter App

```bash
cd apps/customer
flutter pub get
flutter run
```

## Database Setup

1. Go to [Supabase Dashboard](https://app.supabase.com) → SQL Editor
2. Paste and run the contents of `database/schema.sql`

## Deployment

- **Backend**: Render (see `render.yaml`) → https://ubike-api.onrender.com
- **Admin**: Vercel → https://ubike-admin.vercel.app
- **Database**: Supabase project `wkqbbovazwphkeeurinz`

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/otp/send` | Send phone OTP |
| POST | `/api/v1/auth/otp/verify` | Verify OTP + get tokens |
| POST | `/api/v1/auth/login` | Email/password login |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/rides` | Request a ride |
| POST | `/api/v1/rides/estimate` | Get fare estimate |
| POST | `/api/v1/rides/:id/accept` | Rider accepts ride |
| POST | `/api/v1/rides/:id/complete` | Complete ride |
| POST | `/api/v1/errands` | Request an errand |
| POST | `/api/v1/errands/:id/accept` | Rider accepts errand |
| POST | `/api/v1/payments/rides/initialize` | Start Paystack payment |
| GET | `/api/v1/payments/verify/:ref` | Verify payment |
| GET | `/api/v1/admin/dashboard` | Admin stats |
| GET | `/api/v1/admin/kyc` | Pending KYC reviews |

## Rider Separation

- **Passenger Riders** (`passenger_rider` role) — Transport only, cannot take errands
- **Errands Riders** (`errands_rider` role) — Deliveries only, cannot take passenger rides

## Fare Logic

- Base fare: KES 100
- Per km: KES 50
- Electric bike surcharge: ×1.2
- Riders can propose fare increase up to +30% (customer must approve)
- Surge pricing via zone-based multipliers stored in `surge_zones` table
