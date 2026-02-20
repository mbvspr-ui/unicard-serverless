# Deployment Guide - Automatic Cache Busting & Update Detection

## Overview
The system now includes automatic cache busting and real-time update detection. When you deploy a new version, users will be automatically notified within 30 seconds without needing to refresh.

## How It Works

1. **Version Check**: The app checks for updates:
   - On initial load
   - Every 30 seconds while the app is open
   - When user switches back to the tab
   - When the browser window regains focus

2. **Remote Version Check**: The app fetches `version.json` from the server to detect new deployments

3. **Update Prompt**: If versions don't match, users see a full-screen update notification

4. **Cache Clearing**: When users click "Update Now", the system:
   - Clears all browser caches
   - Clears localStorage (except auth tokens)
   - Unregisters service workers
   - Forces a hard refresh

## Deployment Steps

### Every Time You Deploy Changes:

1. **Update Version Number** in both portals:
   
   **School Portal:**
   ```typescript
   // File: school-portal/src/utils/version.ts
   export const APP_VERSION = '1.1.6'; // Increment this
   ```
   
   ```json
   // File: school-portal/public/version.json
   {
     "version": "1.1.6",
     "timestamp": "2026-02-20T00:00:00.000Z"
   }
   ```
   
   **Admin Portal:**
   ```typescript
   // File: admin-portal/src/utils/version.ts
   export const APP_VERSION = '1.1.6'; // Increment this
   ```
   
   ```json
   // File: admin-portal/public/version.json
   {
     "version": "1.1.6",
     "timestamp": "2026-02-20T00:00:00.000Z"
   }
   ```

2. **Build Both Portals:**
   ```bash
   cd school-portal && npm run build
   cd ../admin-portal && npm run build
   ```

3. **Commit and Push:**
   ```bash
   git add -A
   git commit -m "v1.1.6: [describe changes]"
   git push origin main
   ```

4. **Vercel Auto-Deploy:**
   - Vercel will automatically deploy both portals
   - Users will see the update notification within 30 seconds

## Update Detection Timeline

- **Immediate**: Users who load the app after deployment
- **Within 30 seconds**: Users who already have the app open
- **On tab switch**: Users who switch back to the app tab
- **On window focus**: Users who return to the browser window

## Version Numbering Convention

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR** (1.x.x): Breaking changes, major redesigns
- **MINOR** (x.1.x): New features, significant improvements
- **PATCH** (x.x.1): Bug fixes, minor improvements

Examples:
- `1.0.5` → `1.0.6`: Bug fix or minor improvement
- `1.0.6` → `1.1.0`: New feature added
- `1.1.0` → `2.0.0`: Major redesign or breaking changes

## What Gets Cleared

When users update:
- ✅ Browser cache
- ✅ Service worker cache
- ✅ localStorage (except auth tokens)
- ✅ Session storage
- ❌ Auth tokens (preserved)
- ❌ Login sessions (preserved)

## User Experience

### Update Notification:
```
┌─────────────────────────────────────┐
│  🔄  Update Available               │
│                                     │
│  A new version of the app is        │
│  available. Please update to get    │
│  the latest features.               │
│                                     │
│  Version: 1.0.6                     │
│                                     │
│  [Update Now]  [X]                  │
└─────────────────────────────────────┘
```

- **Update Now**: Clears cache and reloads
- **X (Dismiss)**: Updates version without clearing cache (not recommended)

## Testing Updates Locally

1. Change version in `version.ts`
2. Run `npm run dev`
3. Open browser DevTools → Application → Local Storage
4. Delete the version key (`app_version` or `admin_app_version`)
5. Refresh page - you should see the update notification

## Troubleshooting

### Users Not Seeing Update Notification?
- Check if version was updated in `version.ts`
- Verify deployment completed successfully
- Ask users to hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Update Notification Keeps Appearing?
- Check if version in code matches deployed version
- Clear browser cache manually
- Check browser console for errors

## Quick Deployment Checklist

- [ ] Update `APP_VERSION` in `school-portal/src/utils/version.ts`
- [ ] Update `APP_VERSION` in `admin-portal/src/utils/version.ts`
- [ ] Commit with descriptive message
- [ ] Push to GitHub
- [ ] Verify Vercel deployment succeeded
- [ ] Test on one device to confirm update notification appears

## Files Modified

### School Portal:
- `school-portal/src/utils/version.ts` - Version management
- `school-portal/src/components/UpdateNotification.tsx` - Update UI
- `school-portal/src/App.tsx` - Added UpdateNotification component

### Admin Portal:
- `admin-portal/src/utils/version.ts` - Version management
- `admin-portal/src/components/UpdateNotification.tsx` - Update UI
- `admin-portal/src/App.tsx` - Added UpdateNotification component

## Benefits

✅ **No More Stale Cache Issues**: Users always get the latest version
✅ **Automatic Updates**: No manual cache clearing needed
✅ **Better UX**: Clear notification when updates are available
✅ **Preserves Auth**: Users stay logged in after update
✅ **Simple Deployment**: Just increment version and push
