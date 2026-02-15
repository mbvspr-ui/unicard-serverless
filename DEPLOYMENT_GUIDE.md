# Unicard Serverless Deployment Guide

This guide covers deploying the complete Unicard serverless system to production.

## Architecture Overview

- **Background Removal Service**: Railway (Python Flask)
- **School Portal**: Vercel (React + Vite)
- **Admin Portal**: Vercel (React + Vite)
- **API**: Vercel Serverless Functions (Node.js)
- **Database**: Aiven PostgreSQL
- **Storage**: Cloudflare R2
- **Email**: Brevo SMTP

---

## Prerequisites

1. GitHub account with repositories:
   - `background_remover` - For background removal service
   - `unicard-serverless` - For portals and API

2. Accounts:
   - Railway account (for background removal)
   - Vercel account (for portals)
   - Aiven PostgreSQL database (already set up)
   - Cloudflare R2 storage (already set up)
   - Brevo SMTP (already set up)

3. Environment variables ready (see below)

---

## Part 1: Deploy Background Removal Service to Railway

### Step 1: Push to GitHub

```bash
# Navigate to background removal service
cd unicard-serverless/background-removal-service

# Initialize git (if not already)
git init
git add .
git commit -m "Initial commit: Background removal service"

# Add remote and push
git remote add origin https://github.com/mbvspr-ui/background_remover.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `background_remover` repository
5. Railway will auto-detect the Dockerfile

### Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

```
PORT=8080
FLASK_ENV=production
CORS_ORIGINS=https://your-school-portal.vercel.app,https://your-admin-portal.vercel.app
```

### Step 4: Get Railway URL

After deployment, Railway will provide a URL like:
`https://background-remover-production.up.railway.app`

Save this URL - you'll need it for the portals.

---

## Part 2: Deploy School Portal to Vercel

### Step 1: Push to GitHub

```bash
# From project root
cd unicard-serverless

# Initialize git (if not already)
git init
git add school-portal/ api/ .gitignore
git commit -m "Initial commit: School portal and API"

# Add remote and push
git remote add origin https://github.com/mbvspr-ui/unicard-serverless.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import `unicard-serverless` repository
4. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `school-portal`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 3: Configure Environment Variables

In Vercel project settings, add:

```
VITE_API_URL=https://your-vercel-api.vercel.app/api
VITE_BG_REMOVAL_URL=https://your-railway-app.up.railway.app
```

### Step 4: Deploy

Click "Deploy" - Vercel will build and deploy automatically.

---

## Part 3: Deploy Admin Portal to Vercel

### Step 1: Create New Vercel Project

1. In Vercel, click "Add New Project"
2. Import the same `unicard-serverless` repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `admin-portal`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Step 2: Configure Environment Variables

```
VITE_API_URL=https://your-vercel-api.vercel.app/api
```

### Step 3: Deploy

Click "Deploy".

---

## Part 4: Deploy API to Vercel

### Step 1: Create New Vercel Project

1. In Vercel, click "Add New Project"
2. Import the same `unicard-serverless` repository
3. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `api`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty

### Step 2: Configure Environment Variables

```
DATABASE_URL=your_aiven_postgresql_url
JWT_SECRET=your_jwt_secret
R2_ACCOUNT_ID=your_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=unicard-files
R2_PUBLIC_URL=https://your-r2-bucket.r2.dev
BG_REMOVAL_URL=https://your-railway-app.up.railway.app
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
EMAIL_SECURE=false
SMTP_USER=your_brevo_smtp_user
SMTP_PASS=your_brevo_smtp_password
SMTP_FROM=your-email@example.com
SMTP_FROM_NAME=Samiul Graphics
FRONTEND_URL=https://your-school-portal.vercel.app
NODE_ENV=production
```

**Note:** Email OTP verification is disabled. Schools are auto-approved and can login immediately. SMTP is only used for password reset emails.

### Step 3: Deploy

Vercel will automatically deploy the serverless functions.

---

## Part 5: Update CORS and URLs

### Update Railway CORS

Go back to Railway and update `CORS_ORIGINS`:

```
CORS_ORIGINS=https://school-portal.vercel.app,https://admin-portal.vercel.app
```

### Verify Database Connection

1. Ensure Aiven PostgreSQL is accessible
2. Test database connection from Vercel
3. Verify all migrations are applied

---

## Part 6: Verify Deployment

### Test Background Removal

```bash
curl -X POST https://your-railway-app.up.railway.app/health
```

### Test School Portal

Visit: `https://school-portal.vercel.app`

### Test Admin Portal

Visit: `https://admin-portal.vercel.app`

### Test API

```bash
curl https://your-vercel-api.vercel.app/api/health
```

---

## Git Commands Summary

### For Background Remover (Separate Repo)

```bash
cd unicard-serverless/background-removal-service
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/mbvspr-ui/background_remover.git
git branch -M main
git push -u origin main
```

### For Unicard Serverless (Main Repo)

```bash
cd unicard-serverless
git init

# Add only necessary files (exclude .md files)
git add school-portal/
git add admin-portal/
git add api/
git add .gitignore
git add package.json
git add README.md

git commit -m "Initial commit: Unicard serverless system"
git remote add origin https://github.com/mbvspr-ui/unicard-serverless.git
git branch -M main
git push -u origin main
```

---

## Environment Variables Reference

### School Portal (.env)

```env
VITE_API_URL=
VITE_BG_REMOVAL_URL=
```

### Admin Portal (.env)

```env
VITE_API_URL=
```

### API (.env)

```env
DATABASE_URL=
JWT_SECRET=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=
BG_REMOVAL_URL=
SMTP_HOST=
SMTP_PORT=
EMAIL_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
SMTP_FROM_NAME=
FRONTEND_URL=
NODE_ENV=production
```

**Note:** SMTP is used for password reset emails only. OTP verification is disabled

### Background Removal (.env)

```env
PORT=8080
FLASK_ENV=production
CORS_ORIGINS=
```

---

## Troubleshooting

### Railway Issues

- Check logs in Railway dashboard
- Ensure Dockerfile builds successfully
- Verify environment variables are set

### Vercel Issues

- Check build logs
- Ensure all environment variables are set
- Verify root directory is correct

### CORS Issues

- Update Railway CORS_ORIGINS with actual Vercel URLs
- Verify Cloudflare R2 CORS settings

### Database Issues

- Check Aiven PostgreSQL connection
- Verify DATABASE_URL is correct
- Ensure IP whitelist includes Vercel IPs (or set to 0.0.0.0/0)

---

## Post-Deployment

1. Test all features end-to-end
2. Monitor Railway and Vercel logs
3. Set up custom domains (optional)
4. Configure SSL certificates (automatic on Vercel/Railway)
5. Set up monitoring and alerts

---

## Continuous Deployment

Both Railway and Vercel support automatic deployments:

- **Railway**: Auto-deploys on push to main branch
- **Vercel**: Auto-deploys on push to main branch

To update:

```bash
git add .
git commit -m "Update: description"
git push origin main
```

---

## Support

For issues:
- Railway: Check Railway dashboard logs
- Vercel: Check Vercel deployment logs
- Supabase: Check Supabase logs and monitoring
