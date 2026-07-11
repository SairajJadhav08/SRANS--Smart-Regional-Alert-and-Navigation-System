# SRANS Backend

Express.js + TypeScript backend for the Smart Regional Alert & Navigation System.

## Stack

- **Runtime** — Node.js with Express v5
- **Language** — TypeScript
- **Database** — PostgreSQL via [Neon](https://neon.tech) (serverless)
- **ORM** — Prisma v7
- **Auth** — JWT (jsonwebtoken + bcryptjs)
- **AI** — Groq SDK (llama-3.3-70b-versatile)

## Setup

### 1. Configure environment

```bash
cp .env.example .env
```

Fill in the three required values in `.env`:
- `DATABASE_URL` — from your Neon dashboard
- `JWT_SECRET` — any long random string
- `GROQ_API_KEY` — from console.groq.com

### 2. Push schema to Neon

```bash
npm run db:push
```

### 3. Generate Prisma client

```bash
npm run db:generate
```

### 4. Start dev server

```bash
npm run dev
```

Server runs at `http://localhost:5000`

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Register citizen or gov user |
| POST | `/login` | — | Returns JWT + user object |
| POST | `/logout` | JWT | Acknowledges logout (stateless) |
| GET | `/me` | JWT | Returns current user |
| GET | `/admin/gov-users` | Superuser | List all gov users |
| POST | `/admin/gov-users/:id/approve` | Superuser | Approve gov user |
| POST | `/admin/gov-users/:id/revoke` | Superuser | Revoke gov user |

### Alerts — `/api/alerts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List all alerts (`?type=Traffic&author_only=true`) |
| GET | `/:id` | — | Get single alert |
| POST | `/` | Gov | Create alert |
| PUT | `/:id` | Gov (owner) | Update alert |
| DELETE | `/:id` | Gov (owner) | Delete alert |
| POST | `/bulk-delete` | Gov | Delete multiple alerts by IDs |

### Saved Routes — `/api/routes`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | JWT | Get user's saved routes |
| POST | `/` | JWT | Save a new route |
| DELETE | `/:id` | JWT (owner) | Delete a saved route |

### AI — `/api/ai`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/routine-planner` | JWT | AI route plan for a saved route |
| POST | `/chat` | JWT | Travel assistant chat |

### Contact — `/api/contact`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | — | Submit contact form |

---

## Scripts

```bash
npm run dev              # Start with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled production build
npm run db:push          # Push schema to Neon (no migration file)
npm run db:migrate       # Create and apply a migration
npm run db:migrate:deploy # Apply migrations in production
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio GUI
```

## Deployment (Render)

1. Create a new **Web Service** on Render
2. Set **Build Command**: `npm install && npm run db:generate && npm run build`
3. Set **Start Command**: `npm run db:migrate:deploy && npm start`
4. Add all environment variables from `.env.example`
