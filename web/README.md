# Medium Clone Frontend (Next.js)

This `web/` folder contains a full Next.js frontend for the deployed backend API.

## Features

- Guest home (`/`) with:
  - Top Posts from `GET /posts/top`
  - Latest Posts from `GET /posts`
- Auth flow:
  - Login (`/login`) with JWT storage in localStorage
  - Register (`/register`)
  - Logout
- Authenticated home (`/`) with:
  - Main feed from `GET /posts`
  - Search and tag filters (`search`, `tag` query)
  - Like/unlike toggle (`POST/DELETE /posts/{id}/like`)
- Dashboard (`/dashboard`) for AUTHOR/ADMIN:
  - Create post draft (`POST /posts`)
  - Edit post (`PATCH /posts/{id}`)
  - Publish draft (`POST /posts/{id}/publish`)
  - Delete post (`DELETE /posts/{id}`)
  - Drafts + all user posts from `GET /posts/me`
- Profile (`/profile`):
  - View and update profile (`GET/PATCH /users/me`)
  - Change password (`PATCH /users/me/password`)
- RBAC in UI:
  - AUTHOR/ADMIN/SUPER_ADMIN can access dashboard
  - VIEWER is read-only

## Environment

Create `.env.local` in `web/`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api/v1
```

## Run Locally

```bash
cd web
npm install
npm run dev
```

## Render Deployment (Web Service)

- Root Directory: `web`
- Build Command: `npm install && npm run build`
- Start Command: `npm run start`
- Environment Variable:
  - `NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com/api/v1`

Recommended runtime: Node 20+