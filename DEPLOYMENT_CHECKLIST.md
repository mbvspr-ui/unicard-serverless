# Deployment Checklist

Use this checklist to ensure a smooth deployment process.

## Pre-Deployment

### ✅ Code Preparation
- [ ] All code is committed locally
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] Environment variables are documented
- [ ] .gitignore is properly configured
- [ ] Build succeeds locally for all apps

### ✅ GitHub Repositories
- [ ] `background_remover` repository created
- [ ] `unicard-serverless` repository created
- [ ] Both repositories are empty and ready

### ✅ Accounts Setup
- [ ] Railway account created and verified
- [ ] Vercel account created and verified
- [ ] Aiven PostgreSQL database is running
- [ ] Cloudflare R2 storage is configured
- [ ] Brevo SMTP is set up
- [ ] All credentials are accessible

### ✅ Environment Variables Ready
- [ ] Aiven PostgreSQL connection string
- [ ] Cloudflare R2 credentials
- [ ] Brevo SMTP credentials
- [ ] JWT secret generated
- [ ] All service URLs documented

---

## Deployment Steps

### 1. Background Removal Service (Railway)

- [ ] Code pushed to `background_remover` repository
- [ ] Railway project created
- [ ] Repository connected to Railway
- [ ] Environment variables configured:
  - [ ] PORT
  - [ ] FLASK_ENV
  - [ ] CORS_ORIGINS
- [ ] Deployment successful
- [ ] Health check passes: `/health` endpoint
- [ ] Railway URL saved for later use

**Railway URL:** `_______________________________`

---

### 2. School Portal (Vercel)

- [ ] Code pushed to `unicard-serverless` repository
- [ ] Vercel project created
- [ ] Root directory set to `school-portal`
- [ ] Framework preset set to Vite
- [ ] Environment variables configured:
  - [ ] VITE_API_URL
  - [ ] VITE_BG_REMOVAL_URL
- [ ] Deployment successful
- [ ] Site loads in browser
- [ ] Login functionality works

**School Portal URL:** `_______________________________`

---

### 3. Admin Portal (Vercel)

- [ ] Vercel project created (same repo)
- [ ] Root directory set to `admin-portal`
- [ ] Framework preset set to Vite
- [ ] Environment variables configured:
  - [ ] VITE_API_URL
- [ ] Deployment successful
- [ ] Site loads in browser
- [ ] Login functionality works

**Admin Portal URL:** `_______________________________`

---

### 4. API (Vercel Serverless)

- [ ] Vercel project created (same repo)
- [ ] Root directory set to `api`
- [ ] Framework preset set to Other
- [ ] Environment variables configured:
  - [ ] DATABASE_URL (Aiven PostgreSQL)
  - [ ] JWT_SECRET
  - [ ] R2_ACCOUNT_ID
  - [ ] R2_ACCESS_KEY_ID
  - [ ] R2_SECRET_ACCESS_KEY
  - [ ] R2_BUCKET_NAME
  - [ ] R2_PUBLIC_URL
  - [ ] BG_REMOVAL_URL
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] SMTP_FROM
  - [ ] FRONTEND_URL
  - [ ] NODE_ENV
- [ ] Deployment successful
- [ ] Health check passes: `/api/health`
- [ ] API endpoints respond correctly

**API URL:** `_______________________________`

---

## Post-Deployment Configuration

### ✅ Update CORS Settings

- [ ] Railway CORS_ORIGINS updated with actual Vercel URLs
- [ ] Railway service redeployed with new CORS settings
- [ ] CORS working between services

### ✅ External Services Configuration

- [ ] Aiven PostgreSQL accessible from Vercel
- [ ] Cloudflare R2 CORS configured
- [ ] Brevo SMTP tested and working
- [ ] All service connections verified

### ✅ DNS & Custom Domains (Optional)

- [ ] Custom domain for School Portal
- [ ] Custom domain for Admin Portal
- [ ] Custom domain for API
- [ ] Custom domain for Background Removal
- [ ] SSL certificates active

---

## Testing

### ✅ Background Removal Service

- [ ] Health endpoint responds: `curl https://your-railway.up.railway.app/health`
- [ ] Can process image removal request
- [ ] CORS headers present in responses

### ✅ School Portal

- [ ] Homepage loads
- [ ] Registration works
- [ ] Login works
- [ ] Student list loads
- [ ] Photo upload works
- [ ] Background removal works
- [ ] Submit for printing works

### ✅ Admin Portal

- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard loads
- [ ] School list loads
- [ ] Order management works
- [ ] Template management works

### ✅ API

- [ ] Health check: `curl https://your-api.vercel.app/api/health`
- [ ] Authentication endpoints work
- [ ] Student endpoints work
- [ ] Order endpoints work
- [ ] Template endpoints work

### ✅ Integration Testing

- [ ] End-to-end student registration flow
- [ ] Photo upload and background removal
- [ ] Submit for printing workflow
- [ ] Admin approval workflow
- [ ] Email notifications (if configured)

---

## Monitoring & Maintenance

### ✅ Set Up Monitoring

- [ ] Railway logs accessible
- [ ] Vercel logs accessible
- [ ] Supabase logs accessible
- [ ] Error tracking configured (optional)
- [ ] Uptime monitoring (optional)

### ✅ Documentation

- [ ] Deployment URLs documented
- [ ] Environment variables documented
- [ ] Access credentials secured
- [ ] Team members have access
- [ ] Runbook created for common issues

---

## Rollback Plan

### ✅ Backup Strategy

- [ ] Database backup taken
- [ ] Previous deployment versions noted
- [ ] Rollback procedure documented

### If Something Goes Wrong:

1. **Railway**: Redeploy previous version from dashboard
2. **Vercel**: Rollback to previous deployment from dashboard
3. **Database**: Restore from backup if needed
4. **Check logs**: Railway, Vercel, and Supabase logs

---

## Success Criteria

- [ ] All services are deployed and running
- [ ] All health checks pass
- [ ] Users can register and login
- [ ] Students can be added and managed
- [ ] Photos can be uploaded and processed
- [ ] Background removal works
- [ ] Orders can be submitted
- [ ] Admin can manage orders
- [ ] No CORS errors
- [ ] No authentication errors
- [ ] Performance is acceptable

---

## Notes

**Deployment Date:** `_______________`

**Deployed By:** `_______________`

**Issues Encountered:**

```
[Add any issues and how they were resolved]
```

**Additional Notes:**

```
[Add any additional notes or observations]
```

---

## Quick Reference

### Railway Dashboard
https://railway.app/dashboard

### Vercel Dashboard
https://vercel.com/dashboard

### Aiven Console
https://console.aiven.io

### Cloudflare Dashboard
https://dash.cloudflare.com

### Brevo Dashboard
https://app.brevo.com

### GitHub Repositories
- Background Remover: https://github.com/mbvspr-ui/background_remover
- Unicard Serverless: https://github.com/mbvspr-ui/unicard-serverless

---

**Status:** ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed
