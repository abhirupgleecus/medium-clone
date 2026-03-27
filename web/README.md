# Medium Clone Frontend (Next.js)

This `web/` folder contains the production frontend for the InkWell backend API.

## Features

- Editorial home (`/`):
  - Top Posts rail (`GET /posts/top`)
  - Most Recent feed (`GET /posts`)
  - Search + topic filtering
  - Like/unlike interactions
- Authentication:
  - Register (`/register`)
  - Sign in (`/login`)
  - Email verification page (`/verify-email`) using token link flow
- Dashboard (`/dashboard`) for `contributor`, `author`, `admin`, `super_admin`:
  - Rich-text create/edit post flow
  - Cover image upload via backend upload auth + ImageKit
  - Draft management
  - Contributor submit-for-review action
  - Author/admin publish action
- Profile (`/profile`):
  - Update profile info
  - Change password
  - Submit contribution access request
- Moderation (`/moderation`) for `admin` and `super_admin`:
  - Approve/reject contribution requests
  - Approve/reject posts in scrutiny queue

## Environment

Create `.env.local` in `web/`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

## Local Development

```bash
cd web
npm install
npm run dev
```

## Deployment (Render Web Service)

- Root Directory: `web`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Environment Variables:
  - `NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api/v1`

Recommended runtime: Node 20+

## Production Readiness Checks

```bash
npm run lint
npm run build
```

Both must pass before deployment.