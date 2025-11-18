# Vercel Deployment - Step by Step Guide

## Issue Fixed
The error "If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present" has been resolved by updating the API's vercel.json to use `rewrites` instead of the deprecated `routes` property.

---

## Deployment Order

Deploy in this order:
1. **API** (Backend first)
2. **School Portal** (Frontend)
3. **Admin Portal** (Frontend)

---

## 1. Deploy API Backend

### Vercel Configuration:
- **Framework Preset**: Other
- **Root Directory**: `api`
- **Build Command**: (leave empty)
- **Output Directory**: (leave empty)
- **Install Command**: `npm install --legacy-peer-deps`

### Environment Variables to Add:

```env
DATABASE_URL=your_aiven_postgresql_url
JWT_SECRET=your_jwt_secret_min_32_chars
R2_ACCOUNT_ID=your_cloudflare_r2_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=unicard-files
R2_PUBLIC_URL=https://your-bucket.r2.dev
BG_REMOVAL_URL=https://your-railway-app.up.railway.app
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
EMAIL_SECURE=false
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=UniCraft Solutions
FRONTEND_URL=https://your-school-portal.vercel.app
NODE_ENV=production
```

**Note:** Email OTP verification is disabled. Schools are auto-approved and can login immediately. SMTP is only used for password reset emails.

### After Deployment:
- Note the API URL (e.g., `https://unicard-api.vercel.app`)
- Test health endpoint: `https://your-api-url.vercel.app/api/health`

---

## 2. Deploy School Portal

### Vercel Configuration:
- **Framework Preset**: Vite
- **Root Directory**: `school-portal`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### Environment Variables:

```env
VITE_API_URL=https://your-api-url.vercel.app/api
VITE_BG_REMOVAL_URL=https://your-railway-app.up.railway.app
```

### After Deployment:
- Visit the school portal URL
- Test registration and login

---

## 3. Deploy Admin Portal

### Vercel Configuration:
- **Framework Preset**: Vite
- **Root Directory**: `admin-portal`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install --legacy-peer-deps`

### Environment Variables:

```env
VITE_API_URL=https://your-api-url.vercel.app/api
```

### After Deployment:
- Visit the admin portal URL
- Test admin login

---

## Important Notes

### Environment Variables
- Don't paste `.env` file contents directly in Vercel
- Add each variable individually using the Key/Value interface
- Remove the `@` prefix from variable names (that's for Vercel secrets, not needed here)

### CORS Configuration
After all deployments, update your Railway background removal service with the actual URLs:

```env
CORS_ORIGINS=https://school-portal-url.vercel.app,https://admin-portal-url.vercel.app
```

### Database Access
Ensure your Aiven PostgreSQL allows connections from Vercel:
- Either whitelist Vercel IPs
- Or allow all IPs (0.0.0.0/0) if using SSL

### Testing Checklist
- [ ] API health endpoint responds
- [ ] School registration works
- [ ] Email OTP is sent
- [ ] Login works
- [ ] Photo upload works
- [ ] Background removal works
- [ ] Admin login works
- [ ] Admin can view submissions

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Ensure TypeScript compiles without errors

### API Returns 500
- Check Vercel function logs
- Verify DATABASE_URL is correct
- Test database connection

### CORS Errors
- Update Railway CORS_ORIGINS with actual Vercel URLs
- Verify R2 bucket CORS settings
- Check API headers configuration

### Environment Variables Not Working
- Redeploy after adding environment variables
- Verify variable names match exactly (case-sensitive)
- Check for typos in URLs

---

## Quick Commands

### Test API Health
```bash
curl https://your-api-url.vercel.app/api/health
```

### Test School Registration
```bash
curl -X POST https://your-api-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com","password":"Test123!","schoolName":"Test School"}'
```

### View Logs
- Vercel Dashboard → Your Project → Deployments → View Function Logs
- Railway Dashboard → Your Service → Deployments → View Logs

---

## Post-Deployment Updates

To update any component:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```
3. Vercel auto-deploys from the main branch

---

## Custom Domains (Optional)

In Vercel project settings:
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with new domain URLs

---

## Need Help?

Check these resources:
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Project README files in each directory
