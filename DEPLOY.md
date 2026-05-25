# KidsVerse — Vercel Deployment Guide

## Prerequisites

- A [Vercel](https://vercel.com) account (free Hobby plan works)
- A [Firebase](https://firebase.google.com) project with Auth, Firestore, and Storage enabled
- An optional [Stripe](https://stripe.com) account for subscription billing
- An optional [YouTube Data API v3](https://console.cloud.google.com/apis/library/youtube.googleapis.com) key

---

## Step 1 — Push to GitHub

```bash
# Initialize git if needed
git init
git add .
git commit -m "KidsVerse v1.0.0 — production ready"

# Push to a GitHub repository
git remote add origin https://github.com/<your-username>/kidsverse.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Connect to Vercel

### Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository (`kidsverse`)
3. Vercel auto-detects **Vite** — the framework, build command, and output directory are pre-filled from `vercel.json`
4. Click **Deploy**

### Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy (follows prompts, first-time setup)
vercel

# Deploy to production
npm run vercel
```

---

## Step 3 — Configure Environment Variables

In the Vercel Dashboard, go to **Settings > Environment Variables** and add the following:

| Variable | Description | Example |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain | `kidsverse.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `kidsverse-prod` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket | `kidsverse-prod.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | `1:123:web:abc...` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics measurement ID (optional) | `G-XXXXXXXXXX` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_live_...` |
| `VITE_APP_URL` | Your Vercel URL | `https://kidsverse.vercel.app` |
| `VITE_MAX_CHILD_PROFILES` | Max child profiles per parent | `5` |
| `VITE_FREE_TIER_MINUTES_PER_DAY` | Free tier daily screen time | `30` |
| `VITE_PREMIUM_TIER_MINUTES_PER_DAY` | Premium tier daily screen time | `120` |
| `VITE_YOUTUBE_API_KEY` | YouTube Data API key (optional) | `AIzaSy...` |

> **Important**: Use `pk_live_*` for Stripe in production (not `pk_test_*`).

---

## Step 4 — Configure Firebase Auth

After deploying, update your Firebase project settings:

1. Go to **Firebase Console > Authentication > Settings > Authorized domains**
2. Add your Vercel domain (e.g. `kidsverse.vercel.app` and any custom domain)
3. If using a custom domain, add that too

### Firestore Security Rules

Ensure your Firestore rules restrict access appropriately:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Parent profiles — only the authenticated parent can read/write their own
    match /parentProfiles/{parentId} {
      allow read, write: if request.auth != null && request.auth.uid == parentId;
    }

    // Child profiles — parent-owned
    match /childProfiles/{childId} {
      allow read, write: if request.auth != null
        && get(/databases/$(database)/documents/parentProfiles/$(request.auth.uid)).data != null;
    }

    // Progress, badges, game scores — tied to parent
    match /{collection}/{docId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Step 5 — Custom Domain (Optional)

1. In Vercel Dashboard, go to **Settings > Domains**
2. Add your custom domain (e.g. `kidsverse.app`)
3. Update DNS records as instructed by Vercel
4. Update `VITE_APP_URL` environment variable to the new domain
5. Re-add the domain in **Firebase Auth > Authorized domains**

---

## Step 6 — Post-Deploy Checklist

- [ ] Site loads at the Vercel URL
- [ ] Parent login and registration work
- [ ] Child profiles can be created
- [ ] Learning modules load and function
- [ ] Games are playable
- [ ] Stories display correctly
- [ ] Creative tools (draw, color, gallery) work
- [ ] Video section loads (if YouTube API configured)
- [ ] Screen time limits enforce correctly
- [ ] Progress tracking saves to Firestore
- [ ] Subscription flow works (if Stripe configured)
- [ ] All routes handle browser refresh correctly (SPA rewrites)
- [ ] HTTPS is enforced (automatic on Vercel)
- [ ] Lighthouse audit scores are acceptable

---

## Project Structure (Deployed)

```
dist/
  index.html          — SPA entry point
  assets/             — Hashed JS/CSS bundles (immutable cache)
  favicon/            — App favicon
```

### Key Deployment Details

- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build` (`tsc -b && vite build`)
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Node.js Version**: >= 18.17.0 (specified in `package.json`)

### SPA Routing

All routes are rewritten to `/index.html` via `vercel.json`. This ensures:
- Direct URL access works (e.g. `/parent/dashboard`)
- Browser refresh on any route works
- React Router handles all client-side routing

### Security Headers

Configured in `vercel.json`:
- **Strict-Transport-Security** — HSTS with preload
- **Content-Security-Policy** — Restricts scripts, frames, connections
- **X-Content-Type-Options** — Prevents MIME sniffing
- **X-Frame-Options** — Clickjacking protection (DENY)
- **X-XSS-Protection** — Browser XSS filter
- **Permissions-Policy** — Restricts camera, mic, geolocation
- **Referrer-Policy** — strict-origin-when-cross-origin

### Caching Strategy

- **`/assets/*`** — `Cache-Control: public, max-age=31536000, immutable` (1 year, hash-based filenames)
- **`/favicon/*`** — `Cache-Control: public, max-age=86400` (1 day)
- **`/index.html`** — No cache header (ensures users get latest app version)

---

## Troubleshooting

### Blank page after deploy
- Check browser console for errors
- Ensure all `VITE_*` environment variables are set in Vercel
- Verify Firebase Auth authorized domains include your Vercel URL

### Routes return 404
- The SPA rewrite in `vercel.json` should handle this
- If deploying manually, ensure the hosting platform supports SPA rewrites

### Firebase connection errors
- Verify `VITE_FIREBASE_*` values match your Firebase project
- Check Firebase console for any service restrictions or quota limits
- Ensure Firestore and Storage rules allow reads/writes

### Build fails on Vercel
- Run `npm run build` locally to reproduce
- Check Node.js version matches `engines` in `package.json`
- Review Vercel build logs for specific errors
