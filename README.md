# PulseNews — Real-Time Citizen Journalism Platform

A production-ready, full-stack news platform built with **Next.js 14**, **Node.js/Express**, **PostgreSQL**, and **Prisma**.

---

## 📐 Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | Next.js 14 (App Router), Tailwind CSS, Zustand |
| Backend     | Node.js, Express, TypeScript                  |
| Database    | PostgreSQL + Prisma ORM                       |
| Auth        | JWT (access + refresh tokens) + bcrypt        |
| Images      | Cloudinary                                    |
| Frontend Deploy | Vercel                                   |
| Backend Deploy  | Render.com                               |

---

## 🗂️ Project Structure

```
pulsenews/
├── backend/                    # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (6 models)
│   │   └── seed.ts             # Seed admin + sample posts
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts          # Validated env variables
│   │   │   ├── prisma.ts       # Prisma singleton
│   │   │   ├── cloudinary.ts   # Cloudinary SDK init
│   │   │   └── logger.ts       # Winston logger
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts      # Register, login, refresh, logout, avatar
│   │   │   ├── posts.controller.ts     # CRUD, likes, stats
│   │   │   ├── comments.controller.ts  # Create, list, delete
│   │   │   ├── reports.controller.ts   # Submit content report
│   │   │   └── admin.controller.ts     # Moderation, user mgmt, dashboard
│   │   ├── middleware/
│   │   │   └── index.ts        # Auth, rate limiting, error handling, CORS
│   │   ├── routes/
│   │   │   ├── index.ts        # Route aggregator + health check
│   │   │   ├── auth.routes.ts  # /api/auth/*
│   │   │   ├── posts.routes.ts # /api/posts/*
│   │   │   └── admin.routes.ts # /api/admin/* (admin only)
│   │   ├── utils/
│   │   │   ├── asyncHandler.ts # Wraps async routes — no try/catch needed
│   │   │   ├── jwt.ts          # Sign/verify tokens
│   │   │   ├── response.ts     # Standardised API response helpers
│   │   │   └── upload.ts       # Multer + Cloudinary storage
│   │   ├── validators/index.ts # express-validator chains
│   │   ├── types/index.ts      # Shared TypeScript types
│   │   └── server.ts           # Express app bootstrap
│   ├── .env.example
│   ├── render.yaml             # Render deployment config
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                   # Next.js 14 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx          # Root layout (fonts, toast, AuthProvider)
│   │   │   ├── globals.css         # Tailwind base + custom components
│   │   │   ├── page.tsx            # Home feed (hero, grid, filters, search)
│   │   │   ├── news/[id]/page.tsx  # Full post detail + comments + share
│   │   │   ├── submit/page.tsx     # Submit story (form + image upload)
│   │   │   ├── profile/page.tsx    # User profile + edit + posts
│   │   │   ├── my-stories/page.tsx # User's stories with status filter
│   │   │   └── admin/page.tsx      # Admin dashboard (4 tabs)
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── AuthModal.tsx   # Login/register modal with Zod validation
│   │   │   │   └── AuthProvider.tsx# Session restoration on app load
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx      # Nav, search, user menu, category bar
│   │   │   │   └── Footer.tsx
│   │   │   ├── news/
│   │   │   │   ├── NewsCard.tsx    # Grid + list view card
│   │   │   │   ├── HeroPost.tsx    # Featured post banner
│   │   │   │   ├── Sidebar.tsx     # Trending, stats, categories
│   │   │   │   └── CommentSection.tsx
│   │   │   └── ui/index.tsx        # Skeleton, Spinner, EmptyState, StatusBadge, etc.
│   │   ├── hooks/
│   │   │   ├── usePosts.ts         # Posts feed + single post + likes
│   │   │   └── useAdmin.ts         # Admin stats, posts, users, reports
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance + JWT interceptors + auto-refresh
│   │   │   └── utils.ts            # cn(), timeAgo(), formatCount(), getCategoryColor()
│   │   ├── store/authStore.ts      # Zustand auth state (sessionStorage)
│   │   └── types/index.ts          # Shared TypeScript interfaces
│   ├── tailwind.config.ts
│   ├── next.config.js
│   ├── vercel.json
│   └── package.json
│
├── docker-compose.yml          # Local dev: PostgreSQL + API
└── README.md
```

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ (or Docker)
- Cloudinary account (free tier works)

### Step 1 — Clone & install

```bash
git clone https://github.com/yourname/pulsenews.git
cd pulsenews

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### Step 2 — Set up environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/pulsenews"
JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET=<generate another 64-byte hex>
COOKIE_SECRET=<generate a 32-byte hex>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

**Frontend:**
```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local` is already correct for local dev:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Step 3 — Set up the database

Option A — Use Docker (recommended):
```bash
cd pulsenews   # root directory
docker-compose up -d postgres
```

Option B — Use local PostgreSQL:
```bash
createdb pulsenews
```

### Step 4 — Run Prisma migrations and seed

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npm run db:migrate

# Seed with admin user and sample posts
npm run db:seed
```

Seed creates:
- **Admin:** `admin@pulsenews.com` / `Admin@123456`
- **User:** `jane@pulsenews.com` / `User@123456`

### Step 5 — Start development servers

```bash
# Terminal 1 — Backend API (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Production Deployment

### Backend → Render.com

1. Push `backend/` to a GitHub repo
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Render auto-detects `render.yaml` — review the config
5. Add environment variables in **Render Dashboard → Environment**:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `ALLOWED_ORIGINS` → your Vercel URL
6. Click **Deploy**
7. After deploy, run the seed via Render Shell:
   ```bash
   npm run db:seed
   ```

Your API will be at: `https://pulsenews-api.onrender.com`

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repo
4. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://pulsenews-api.onrender.com/api`
   - `NEXT_PUBLIC_APP_URL=https://yourproject.vercel.app`
5. Click **Deploy**

Your app will be at: `https://yourproject.vercel.app`

### Post-deployment: Update CORS

After both are deployed, update the backend `ALLOWED_ORIGINS` in Render:
```
https://yourproject.vercel.app,http://localhost:3000
```

---

## 🔐 Security Architecture

| Threat               | Protection                                              |
|----------------------|---------------------------------------------------------|
| XSS                  | Helmet CSP headers, xss library on user input           |
| CSRF                 | SameSite cookies + Origin validation in CORS            |
| SQL Injection        | Prisma parameterized queries — no raw SQL               |
| Brute force login    | express-rate-limit (10 attempts / 15 min on auth routes)|
| Token theft          | Refresh tokens stored in HttpOnly cookies               |
| Token replay         | Refresh token rotation — each use invalidates old token |
| Mass assignment      | Explicit Prisma `select` — never expose password hash   |
| Parameter pollution  | hpp middleware                                          |
| NoSQL injection      | express-mongo-sanitize (defence-in-depth)               |
| Clickjacking         | X-Frame-Options: DENY                                   |
| MIME sniffing        | X-Content-Type-Options: nosniff                         |
| Data exposure        | Response serialisation never includes password field    |
| Timing attacks       | bcrypt compare even when user not found                 |
| Oversized payloads   | express body limit: 10kb JSON, 10MB images              |

---

## 📡 API Reference

All endpoints return:
```json
{ "success": true, "message": "...", "data": {...}, "meta": {...} }
```

### Authentication (`/api/auth`)

| Method | Route            | Auth | Description                     |
|--------|------------------|------|---------------------------------|
| POST   | `/register`      | ❌   | Create account                  |
| POST   | `/login`         | ❌   | Login → access + refresh tokens |
| POST   | `/refresh`       | 🍪   | Rotate refresh token            |
| POST   | `/logout`        | ❌   | Revoke refresh token            |
| POST   | `/logout-all`    | ✅   | Revoke all refresh tokens       |
| GET    | `/me`            | ✅   | Get current user                |
| PATCH  | `/profile`       | ✅   | Update name/bio/country         |
| PATCH  | `/avatar`        | ✅   | Upload avatar image             |

### Posts (`/api/posts`)

| Method | Route             | Auth     | Description                         |
|--------|-------------------|----------|-------------------------------------|
| GET    | `/`               | Optional | List approved posts (filter/search) |
| GET    | `/stats`          | ❌       | Platform statistics                 |
| GET    | `/:id`            | Optional | Get single post + comments          |
| POST   | `/`               | ✅       | Submit new post (multipart/form)    |
| PATCH  | `/:id`            | ✅       | Update own post                     |
| DELETE | `/:id`            | ✅       | Delete own post (or admin)          |
| POST   | `/:id/like`       | ✅       | Toggle like                         |
| GET    | `/:postId/comments` | ❌     | List comments                       |
| POST   | `/:postId/comments` | ✅     | Add comment                         |
| DELETE | `/comments/:id`   | ✅       | Delete own comment (or admin)       |
| POST   | `/:postId/report` | ✅       | Report content                      |

**GET /api/posts query params:**
```
?page=1&limit=12&category=Technology&search=nairobi&sort=latest|trending|views
&authorId=<userId>&includeAll=true
```

### Admin (`/api/admin`) — Requires ADMIN role

| Method | Route                    | Description                        |
|--------|--------------------------|------------------------------------|
| GET    | `/stats`                 | Dashboard stats                    |
| GET    | `/posts`                 | All posts (any status)             |
| PATCH  | `/posts/:id/moderate`    | Approve or reject a post           |
| DELETE | `/posts/:id`             | Hard delete a post                 |
| GET    | `/users`                 | All users                          |
| PATCH  | `/users/:id/status`      | Ban / unban / suspend user         |
| GET    | `/reports`               | All content reports                |
| PATCH  | `/reports/:id/resolve`   | Resolve a report                   |

---

## 🗃️ Database Schema

```
User
  id, name, email, password(hashed), role(USER|ADMIN)
  status(ACTIVE|BANNED|SUSPENDED), country, bio
  avatarUrl, avatarPublicId, createdAt

Post
  id, slug(unique), title, description, category
  location, imageUrl, imagePublicId
  status(PENDING|APPROVED|REJECTED), featured
  viewCount, likeCount(denorm), commentCount(denorm)
  authorId → User

Comment
  id, content, postId → Post, authorId → User

Like
  id, postId → Post, userId → User
  UNIQUE(postId, userId)   ← prevents double-likes

Report
  id, reason, details, status(OPEN|RESOLVED|DISMISSED)
  postId → Post, reportedById → User

RefreshToken
  id, token(unique), userId → User, expiresAt
```

---

## ✨ Features Checklist

### User Features
- [x] Registration & login with JWT
- [x] HttpOnly refresh token with rotation
- [x] Submit news stories with image upload
- [x] Title, description, category, location
- [x] Drag-and-drop image upload → Cloudinary
- [x] News feed with hero + grid/list view
- [x] Category filtering + full-text search
- [x] Load more pagination
- [x] Like/unlike with optimistic UI
- [x] Comments (create, list)
- [x] Share (Web Share API + clipboard fallback)
- [x] Report content
- [x] User profile with stats + edit
- [x] My Stories with status filter
- [x] Avatar upload

### Admin Features
- [x] Stats dashboard (posts, users, likes, reports)
- [x] Pending review queue — approve / reject
- [x] All posts management
- [x] User management — ban / unban
- [x] Reports management — resolve / dismiss
- [x] Role-based access control

### Security
- [x] Helmet security headers
- [x] CORS with origin whitelist
- [x] JWT access tokens (15 min expiry)
- [x] HttpOnly refresh cookies (7 days, rotated)
- [x] Refresh token DB storage (revocable)
- [x] bcrypt password hashing (cost 12)
- [x] Constant-time password comparison
- [x] Rate limiting (auth: 10/15min, API: 100/15min)
- [x] Request slow-down
- [x] Input validation + sanitization
- [x] XSS sanitization on comments
- [x] HPP protection
- [x] Body size limits
- [x] Prisma parameterized queries

---

## 🔮 Suggested Enhancements

### Performance
- **Redis** — cache trending posts + rate limit counters
- **CDN** — serve Cloudinary images via CDN edge nodes
- **ISR** — Next.js Incremental Static Regeneration for post pages
- **React Query** — server-state caching to reduce API calls

### Features
- **Push notifications** — notify users when their story is approved
- **Email verification** — verify email on registration with Resend
- **Geolocation** — show nearby news using browser location API
- **AI moderation** — use OpenAI Moderation API to auto-flag content
- **Bookmarks** — let users save stories
- **Newsletter** — weekly digest of top stories
- **Search** — full-text search with PostgreSQL `tsvector` or Meilisearch

### SEO
- Add `generateMetadata()` to each Next.js page
- Create `/sitemap.xml` route for post URLs
- Add `robots.txt`
- JSON-LD structured data for news articles (NewsArticle schema)
- Open Graph images for social sharing

---

## 🧪 Running Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run type-check   # TypeScript checks
npm run lint         # ESLint
```

---

## 📝 Common Issues

**"Cloudinary connection failed" on startup**
→ Check your `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` are correct in `.env`

**CORS errors from frontend**
→ Make sure `ALLOWED_ORIGINS` in backend `.env` includes `http://localhost:3000` (or your production URL)

**"Cannot find module @prisma/client"**
→ Run `npm run db:generate` in the backend directory

**Images not loading in production**
→ Add your Cloudinary hostname to `next.config.js` `images.remotePatterns`

**Refresh token loop**
→ Make sure your frontend `.env.local` `NEXT_PUBLIC_API_URL` points to the correct backend URL

---

*Built with ❤️ — PulseNews © 2026*
