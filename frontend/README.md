# Blog Frontend

Next.js (App Router) + NextAuth (Credentials) sitting in front of the Express
`Blog-App` backend.

## Setup

1. `cd blog-frontend && npm install`
2. Edit `.env.local` and set `NEXTAUTH_SECRET` to a long random string. Confirm
   `BLOG_API_URL` points at the running Blog-App (defaults to `http://localhost:5000`).
3. Start the Blog-App backend (in `../Blog-App`): `npm start`
4. Start the frontend: `npm run dev`
5. Open <http://localhost:3000>, click **Sign in**, and use credentials seeded
   into the Blog-App database.

## How it works

- `lib/auth.js` defines a NextAuth Credentials provider whose `authorize()`
  POSTs `{ email, password }` to `${BLOG_API_URL}/api/user/signin` and stores
  the returned JWT on the NextAuth token.
- `app/api/auth/[...nextauth]/route.js` mounts NextAuth at
  `/api/auth/[...nextauth]`.
- `app/profile/page.js` is a Server Component that calls
  `${BLOG_API_URL}/api/user/profile` with `Authorization: Bearer <jwt>`.
- `middleware.js` gates `/profile/*` so unauthenticated users are bounced to
  `/login`.
