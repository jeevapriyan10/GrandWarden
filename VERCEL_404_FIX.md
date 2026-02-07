# 🔧 Vercel 404 Error - Quick Fix

## Problem
Backend API returning 404 NOT_FOUND on Vercel deployment.

## Root Cause
Vercel serverless functions require specific configuration and the backend needs to export the Express app correctly.

## Solution

### 1. Update Files (Already Done)
- ✅ `backend/index.js` - Fixed export for serverless
- ✅ `vercel.json` - Updated routing configuration

### 2. Commit & Push Changes
```bash
git add .
git commit -m "fix: Update for Vercel serverless deployment"
git push
```

### 3. Vercel Will Auto-Redeploy (~2 min)
Watch the deployment in Vercel dashboard.

### 4. Test After Deploy
Visit these URLs (replace with your actual URL):
- ✅ `https://your-app.vercel.app/health` - Should return JSON
- ✅ `https://your-app.vercel.app/api/dashboard` - Should return data
- ✅ `https://your-app.vercel.app` - Frontend should load

## What Was Fixed

**Before (Not Working):**
```javascript
// Server always tried to start
app.listen(PORT, () => {...})
```

**After (Working):**
```javascript
// Only start server locally, export for Vercel
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {...})
}
module.exports = app;
```

**vercel.json Updated:**
- Changed from `routes` to `rewrites`
- Proper serverless function configuration
- Better memory allocation

## Verification After Fix

1. **Git push** triggers auto-deploy
2. Wait ~2-3 minutes
3. Visit `/health` endpoint
4. Should see:
```json
{
  "status": "ok",
  "timestamp": "...",
  "mongodb": "connected"
}
```

5. Test fact-checking feature
6. ✅ All should work!

---

If still having issues after redeployment, check:
- MongoDB connection string in environment variables
- All 8 environment variables are set
- Vercel function logs for specific errors
