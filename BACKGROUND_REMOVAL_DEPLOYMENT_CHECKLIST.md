# Background Removal Service - Deployment Checklist

## ✅ Pre-Deployment Checklist

- [x] Code is ready in `background-removal-service/` directory
- [x] `requirements.txt` includes all dependencies
- [x] `render.yaml` configuration file created
- [x] `.env.example` file created
- [x] `.gitignore` file created
- [x] README.md with documentation
- [x] RENDER_DEPLOYMENT.md with detailed instructions

## 🚀 Deployment Steps

### 1. Push to GitHub
```bash
cd unicard-serverless/background-removal-service
git add .
git commit -m "Prepare background removal service for Render deployment"
git push origin main
```

### 2. Deploy to Render

**Option A: Via Dashboard (Easiest)**
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect GitHub repository: `mbvspr-ui/unicard-serverless`
4. Configure:
   - **Name**: `unicard-background-removal`
   - **Region**: Singapore
   - **Root Directory**: `background-removal-service`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
   - **Plan**: Free
5. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.0`
   - `DEBUG`: `false`
6. Set Health Check Path: `/health`
7. Click "Create Web Service"

**Option B: Via Blueprint**
1. Go to https://dashboard.render.com/
2. Click "New +" → "Blueprint"
3. Select repository
4. Render detects `render.yaml`
5. Click "Apply"

### 3. Wait for Deployment
- First deployment: 5-10 minutes
- Subsequent deployments: 2-3 minutes
- Watch logs for any errors

### 4. Test the Deployment
```bash
# Replace with your Render URL
export BG_REMOVAL_URL=https://unicard-background-removal.onrender.com

# Health check
curl $BG_REMOVAL_URL/health

# Test background removal
curl -X POST $BG_REMOVAL_URL/remove-background \
  -F "image=@test-image.jpg" \
  -o output.png
```

### 5. Update Frontend Configuration

**Update `.env` in school-portal:**
```env
VITE_BG_REMOVAL_URL=https://unicard-background-removal.onrender.com
```

**Update CORS in `app.py`:**
```python
CORS(app, origins=[
    'http://localhost:3000',
    'https://school.unicard-serverless.com',
    'https://your-actual-domain.com'
])
```

### 6. Redeploy with CORS Update
```bash
git add app.py
git commit -m "Update CORS for production domains"
git push origin main
```

Render will auto-deploy the changes.

## 📊 Post-Deployment Verification

### Test from Frontend
1. Open school portal
2. Go to Add Student page
3. Upload a photo
4. Click "Remove Background"
5. Verify it works (may take 30-60 seconds on first request)

### Monitor Service
- **Dashboard**: https://dashboard.render.com/
- **Logs**: Click on service → "Logs" tab
- **Metrics**: View in dashboard

## ⚠️ Important Notes

### Free Tier Limitations
- Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 750 hours/month (enough for one service)

### Handling Cold Starts
Add loading message in frontend:
```typescript
"Processing image... This may take up to 60 seconds on first use."
```

### Keep Service Warm (Optional)
Use cron-job.org to ping every 14 minutes:
```
https://unicard-background-removal.onrender.com/health
```

## 🔧 Troubleshooting

### Service Won't Start
- Check logs in Render dashboard
- Verify `requirements.txt` is correct
- Check Python version compatibility

### CORS Errors
- Add your domain to CORS origins in `app.py`
- Redeploy after changes

### Slow Performance
- First request is slow (cold start)
- Subsequent requests are faster
- Consider upgrading to paid plan ($7/month) for always-on service

### Out of Memory
- Reduce image size before upload
- Upgrade to paid plan with more RAM

## 💰 Cost Options

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 750 hrs/month, spins down after 15 min |
| **Starter** | $7/month | Always on, no cold starts |
| **Standard** | $25/month | 2 GB RAM, better performance |

## ✨ Success Criteria

- [ ] Service is deployed and accessible
- [ ] Health check returns 200 OK
- [ ] Background removal works from frontend
- [ ] CORS is configured correctly
- [ ] Logs show no errors
- [ ] Frontend displays processed images

## 📝 Next Steps After Deployment

1. **Test thoroughly** with different image types
2. **Monitor performance** in first few days
3. **Collect user feedback** on processing time
4. **Consider upgrading** if cold starts are problematic
5. **Set up monitoring** alerts (optional)

## 🎉 Deployment Complete!

Your background removal service is now live and ready to use!

**Service URL**: `https://unicard-background-removal.onrender.com`

**Documentation**: See `RENDER_DEPLOYMENT.md` for detailed information.
