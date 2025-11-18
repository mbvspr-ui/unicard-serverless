# Quick Start: Deploy Unicard Serverless

## 🚀 Fast Track Deployment

### 1️⃣ Background Remover → Railway

```bash
cd unicard-serverless/background-removal-service
git init
git add .
git commit -m "Deploy to Railway"
git remote add origin https://github.com/mbvspr-ui/background_remover.git
git branch -M main
git push -u origin main
```

**Railway Setup:**
- New Project → Deploy from GitHub → `background_remover`
- Add env vars: `PORT=8080`, `FLASK_ENV=production`, `CORS_ORIGINS=*`
- Copy Railway URL

---

### 2️⃣ Unicard Serverless → GitHub

```bash
cd unicard-serverless
git init
git add school-portal/ admin-portal/ api/ .gitignore package.json README.md
git commit -m "Deploy to Vercel"
git remote add origin https://github.com/mbvspr-ui/unicard-serverless.git
git branch -M main
git push -u origin main
```

---

### 3️⃣ School Portal → Vercel

**Vercel Setup:**
- New Project → Import `unicard-serverless`
- Root Directory: `school-portal`
- Framework: Vite
- Add env vars:
  ```
  VITE_API_URL=https://your-api.vercel.app/api
  VITE_BG_REMOVAL_URL=https://your-railway.up.railway.app
  ```
- Deploy

---

### 4️⃣ Admin Portal → Vercel

**Vercel Setup:**
- New Project → Import `unicard-serverless`
- Root Directory: `admin-portal`
- Framework: Vite
- Add env vars:
  ```
  VITE_API_URL=https://your-api.vercel.app/api
  ```
- Deploy

---

### 5️⃣ API → Vercel

**Vercel Setup:**
- New Project → Import `unicard-serverless`
- Root Directory: `api`
- Framework: Other
- Add env vars:
  ```
  DATABASE_URL=your_aiven_postgresql_url
  JWT_SECRET=your_secret
  R2_ACCOUNT_ID=your_r2_account_id
  R2_ACCESS_KEY_ID=your_r2_access_key
  R2_SECRET_ACCESS_KEY=your_r2_secret
  R2_BUCKET_NAME=unicard-files
  R2_PUBLIC_URL=https://your-r2.r2.dev
  BG_REMOVAL_URL=https://your-railway.up.railway.app
  SMTP_HOST=smtp-relay.brevo.com
  SMTP_PORT=587
  EMAIL_SECURE=false
  SMTP_USER=your_brevo_user
  SMTP_PASS=your_brevo_pass
  SMTP_FROM=your-email@example.com
  SMTP_FROM_NAME=UniCraft Solutions
  FRONTEND_URL=https://your-school-portal.vercel.app
  NODE_ENV=production
  ```
- Deploy

---

## ✅ Verification

1. Railway: `curl https://your-railway.up.railway.app/health`
2. School Portal: Visit URL in browser
3. Admin Portal: Visit URL in browser
4. API: `curl https://your-api.vercel.app/api/health`

---

## 🔄 Updates

```bash
git add .
git commit -m "Update"
git push origin main
```

Auto-deploys on both Railway and Vercel!

---

## 📝 Important Notes

- Exclude `.md` files from git (except README.md)
- Update Railway CORS with actual Vercel URLs after deployment
- Add Vercel URLs to Supabase allowed URLs
- Test all features after deployment

---

## 🆘 Quick Fixes

**Build fails?**
- Check environment variables
- Verify root directory setting
- Check build logs

**CORS errors?**
- Update Railway CORS_ORIGINS
- Check Cloudflare R2 CORS settings

**API not working?**
- Verify all env vars are set
- Check Vercel function logs
- Test with curl

---

See `DEPLOYMENT_GUIDE.md` for detailed instructions.
