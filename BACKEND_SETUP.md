# u-bike Backend Setup Guide

## APIs & Services You Need to Register For

### 1. Supabase (Database + Auth + Storage)
- Go to [supabase.com](https://supabase.com) → New project
- **Free tier**: 500MB database, 1GB storage
- Copy: Project URL, anon key, service role key
- In SQL Editor, run the full `database/schema.sql` file

### 2. Paystack (Payments)
- Go to [paystack.com](https://paystack.com) → Register as a business
- Dashboard → Settings → API Keys & Webhooks
- Copy: Secret key, Public key
- Add webhook URL: `https://yourdomain.com/api/v1/payments/webhook/paystack`
- Enable events: `charge.success`, `transfer.success`, `transfer.failed`

### 3. Africa's Talking (SMS + OTP)
- Go to [africastalking.com](https://africastalking.com)
- Register → Create an app → Get API key
- Sandbox is free for testing — upgrade for production
- Copy: API Key, Username

### 4. Mapbox (Maps + Geocoding)
- Go to [mapbox.com](https://mapbox.com) → Sign up
- **Free tier**: 50,000 geocoding requests/month
- Account → Tokens → Create a token
- Copy: Access token (starts with `pk.`)

### 5. Push Notifications — NO Firebase needed
- Push notifications use **Socket.IO** (online users) + **Supabase Realtime** (mobile subscriptions) + **Africa's Talking SMS** (offline/critical)
- Zero extra cost, zero extra service

### 6. Agora (In-App Voice Calls)
- Go to [agora.io](https://agora.io) → Console
- **Free tier**: 10,000 minutes/month
- Create a project → Enable RTC Token
- Copy: App ID, App Certificate

### 7. Upstash Redis (Caching)
- Go to [upstash.com](https://upstash.com)
- **Free tier**: 10,000 requests/day
- Create a Redis database → **Choose AWS → eu-west-1 (Ireland)** — closest region to East Africa (Kenya)
- After creation, copy the Redis URL (format: `redis://default:TOKEN@hostname.upstash.io:6379`)
- Paste it as `REDIS_URL` in your `.env`

---

## Installation & Setup

```bash
# 1. Clone and enter backend
cd backend

# 2. Install dependencies
npm install

# 3. Copy env file
cp .env.example .env
# Fill in all values from the services above

# 4. Run the database schema
# Open Supabase → SQL Editor → paste contents of database/schema.sql → Run

# 5. Create Supabase Storage bucket
# Supabase → Storage → New bucket → name: "ubike-assets" → Public: ON

# 6. Start development server
npm run start:dev

# API docs available at: http://localhost:3001/docs
```

---

## Backend Architecture Summary

```
backend/src/
├── main.ts                    # App bootstrap (Helmet, CORS, Swagger, pipes)
├── app.module.ts              # Root module wiring
├── database/
│   ├── database.module.ts     # Global Supabase module
│   └── supabase.service.ts    # Supabase client wrapper
├── realtime/
│   ├── realtime.gateway.ts    # Socket.IO gateway (rider tracking, live events)
│   └── realtime.module.ts
├── common/
│   ├── guards/                # JwtAuthGuard, RolesGuard
│   ├── decorators/            # @Public(), @Roles(), @CurrentUser()
│   ├── filters/               # HttpExceptionFilter (standard error shape)
│   ├── interceptors/          # TransformInterceptor (standard response shape)
│   └── enums/                 # All platform enums
└── modules/
    ├── auth/                  # Registration, login, JWT, refresh tokens
    ├── users/                 # Customer profile, saved locations, history
    ├── riders/                # Rider profile, online toggle, location, docs
    ├── rides/                 # Transport ride lifecycle, fare estimates
    ├── errands/               # Errand lifecycle, proof-of-delivery
    ├── wallets/               # Balance, transactions, withdrawals
    ├── payments/              # Paystack integration, webhooks
    ├── chat/                  # Socket.IO chat, message storage
    ├── calls/                 # Agora in-app voice calls
    ├── notifications/         # FCM push + Africa's Talking SMS
    ├── otp/                   # OTP generation, verification, rate limiting
    ├── maps/                  # Mapbox geocoding, routing, distance
    ├── matching/              # Rider matching algorithm, heatmaps
    ├── admin/                 # Admin dashboard, rider approval, withdrawals
    └── analytics/             # Earnings charts, platform revenue
```

---

## Socket.IO Events

### Client → Server
| Event | Namespace | Description |
|-------|-----------|-------------|
| `rider:location` | `/realtime` | Rider sends GPS coordinates |
| `rider:toggle-online` | `/realtime` | Toggle online/offline |
| `track:rider` | `/realtime` | Customer subscribes to rider location |
| `chat:join` | `/chat` | Join a chat room |
| `chat:message` | `/chat` | Send a chat message |
| `chat:typing` | `/chat` | Typing indicator |
| `chat:read` | `/chat` | Mark messages as read |

### Server → Client
| Event | Description |
|-------|-------------|
| `ride:new-request` | New ride request broadcast to nearby riders |
| `errand:new-request` | New errand request broadcast to nearby riders |
| `rider:location:update` | Real-time rider GPS update to customer |
| `chat:new-message` | New message in chat room |
| `chat:typing` | Typing indicator forwarded |
| `chat:messages-read` | Read receipts |

---

## API Endpoints Summary

```
POST /api/v1/auth/register/customer
POST /api/v1/auth/register/rider
POST /api/v1/auth/login
POST /api/v1/auth/verify-phone
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/users/me
PATCH /api/v1/users/me
GET  /api/v1/users/me/rides
GET  /api/v1/users/me/errands

GET  /api/v1/riders/me/dashboard
PATCH /api/v1/riders/me/online
PATCH /api/v1/riders/me/location

POST /api/v1/rides/estimate
POST /api/v1/rides
POST /api/v1/rides/:id/accept
PATCH /api/v1/rides/:id/status
POST /api/v1/rides/:id/cancel
POST /api/v1/rides/:id/rate

POST /api/v1/errands
POST /api/v1/errands/:id/accept
PATCH /api/v1/errands/:id/status
POST /api/v1/errands/:id/proof
POST /api/v1/errands/:id/rate

GET  /api/v1/wallets/me
POST /api/v1/wallets/me/withdraw
POST /api/v1/payments/fund-wallet

POST /api/v1/calls/initiate
GET  /api/v1/calls/:id/token

GET  /api/v1/maps/geocode?q=Nairobi
GET  /api/v1/maps/route?fromLat=...&toLat=...

GET  /api/v1/admin/stats
GET  /api/v1/admin/riders/pending
PATCH /api/v1/admin/riders/:id/verify
GET  /api/v1/admin/withdrawals/pending
POST /api/v1/admin/withdrawals/:id/process

GET  /api/v1/analytics/rider/earnings
```

Full Swagger docs available at `/docs` when running locally.
