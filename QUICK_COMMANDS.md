# Quick Commands Reference

## 🚀 Deployment Commands

### 1. Verify Everything is Ready
```powershell
cd unicard-serverless
.\verify-deployment-ready.ps1
```

### 2. Prepare Git Repositories
```powershell
.\prepare-deployment.ps1
```

### 3. Manual Git Setup (if needed)

**Background Remover:**
```bash
cd background-removal-service
git init
git add .
git commit -m "Deploy to Railway"
git remote add origin https://github.com/mbvspr-ui/background_remover.git
git branch -M main
git push -u origin main
```

**Unicard Serverless:**
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

## 🧪 Testing Commands

### Health Checks
```bash
# Background Removal (Railway)
curl https://your-railway-app.up.railway.app/health

# API (Vercel)
curl https://your-api.vercel.app/api/health
```

### Local Development
```bash
# School Portal
cd school-portal
npm run dev

# Admin Portal
cd admin-portal
npm run dev

# API
cd api
npm run dev
```

---

## 🔧 Troubleshooting Commands

### Kill Ports (if already in use)
```powershell
# School Portal (port 3000)
npx kill-port 3000

# Admin Portal (port 3002)
npx kill-port 3002

# API (port 3001)
npx kill-port 3001
```

### Clean Install
```bash
# Remove and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Check Git Status
```bash
git status
git log --oneline -5
```

---

## 📦 Build Commands

### School Portal
```bash
cd school-portal
npm run build
npm run preview  # Test production build
```

### Admin Portal
```bash
cd admin-portal
npm run build
npm run preview
```

### API
```bash
cd api
npm run build
```

---

## 🔄 Update Commands

### After Making Changes
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

Railway and Vercel will auto-deploy!

---

## 📊 Monitoring Commands

### View Logs (Local)
```bash
# Follow API logs
cd api
npm run dev | tee api.log

# Follow School Portal logs
cd school-portal
npm run dev | tee school.log
```

### Check Environment Variables
```bash
# List all env vars (be careful with sensitive data!)
cat .env

# Check if env var is set
echo $VITE_API_URL
```

---

## 🗂️ File Management

### List Important Files
```powershell
# List all .env.example files
Get-ChildItem -Recurse -Filter ".env.example"

# List all package.json files
Get-ChildItem -Recurse -Filter "package.json"

# Check .gitignore
cat .gitignore
```

### Verify No Sensitive Files
```powershell
# Check for .env files (should not be committed)
Get-ChildItem -Recurse -Filter ".env" | Where-Object { $_.FullName -notlike "*node_modules*" }
```

---

## 🔐 Security Commands

### Generate JWT Secret
```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Test Database Connection
```bash
# Using psql
psql "$DATABASE_URL"

# Test query
psql "$DATABASE_URL" -c "SELECT version();"
```

---

## 📝 Documentation Commands

### View Documentation
```bash
# Main deployment guide
cat DEPLOYMENT_GUIDE.md

# Quick start
cat DEPLOYMENT_QUICK_START.md

# Checklist
cat DEPLOYMENT_CHECKLIST.md

# Status
cat READY_FOR_DEPLOYMENT.md
```

---

## 🎯 One-Line Deployment

### After Git Setup
```bash
# Just push - auto-deploys!
git push origin main
```

---

## 💡 Useful Aliases (Optional)

Add to your PowerShell profile:

```powershell
# Edit profile
notepad $PROFILE

# Add these aliases:
function Deploy-Unicard { git add .; git commit -m $args[0]; git push origin main }
function Test-Health { curl https://your-api.vercel.app/api/health }
function Start-School { cd school-portal; npm run dev }
function Start-Admin { cd admin-portal; npm run dev }
function Start-Api { cd api; npm run dev }

# Usage:
# Deploy-Unicard "Update feature"
# Test-Health
# Start-School
```

---

## 📞 Quick Links

- Railway: https://railway.app/dashboard
- Vercel: https://vercel.com/dashboard
- GitHub: https://github.com/mbvspr-ui

---

**Tip**: Bookmark this file for quick reference during deployment!
