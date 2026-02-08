# GrandWarden Render Deployment Guide

## Step-by-Step Instructions for Render.com

### 1. Prepare Your Code

Your code is already ready! Just push the latest changes:

```bash
git add -A
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Sign Up / Log In to Render

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub (recommended) or email

### 3. Create a New Web Service

1. Click "New +" button (top right)
2. Select "Web Service"
3. Connect your GitHub repository:
   - Click "Connect account" if needed
   - Select your repository: `jeevapriyan10/GrandWarden` (or `Hermes` if not renamed)

### 4. Configure the Web Service

Fill in these EXACT values:

**Basic Settings:**
- **Name**: `grandwarden` (or any name you want)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave EMPTY (blank)
- **Runtime**: `Node`

**Build & Deploy:**
- **Build Command**: 
  ```
  cd frontend && npm install && npm run build && cd ../backend && npm install
  ```

- **Start Command**:
  ```
  cd backend && npm start
  ```

**Instance Type:**
- Select: **Free** (or paid if you want)

### 5. Add Environment Variables

Click "Advanced" then scroll to "Environment Variables".

Add these ONE BY ONE (click "Add Environment Variable" for each):

```
PORT=4000
```

```
NODE_ENV=production
```

```
MONGO_URI=mongodb+srv://jeevapriyan10:myher...
```
(Use your actual MongoDB Atlas connection string from Vercel)

```
MONGO_DB_NAME=hermes_ai
```

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
(Get a new one from https://makersuite.google.com/app/apikey)

```
GROK_API_KEY=
```
(Leave empty for now)

```
CORS_ORIGIN=https://grandwarden.onrender.com
```
(Use your actual Render URL - you might need to add this AFTER first deployment)

### 6. Deploy!

1. Click "Create Web Service" button at the bottom
2. Wait 3-5 minutes for the build to complete
3. Watch the logs - it should show:
   ```
   🚀 GrandWarden Backend running on port 4000
   ✅ Connected to MongoDB
   ```

### 7. Test Your Site

1. Once deployed, Render will give you a URL like: `https://grandwarden.onrender.com`
2. Open that URL in your browser
3. Everything should work EXACTLY like localhost!

### 8. Update CORS After Deployment

1. After you get your Render URL, go back to Settings
2. Update the `CORS_ORIGIN` environment variable to your actual Render URL
3. Click "Save Changes" - it will auto-redeploy

## Troubleshooting

If you see errors:

1. **Build Fails**: Check the build logs in Render dashboard
2. **500 Errors**: Check the deployment logs under "Logs" tab
3. **Database Not Connecting**: Verify your `MONGO_URI` is correct

## Important Notes

- **First request might be slow** on Free tier (cold start)
- **Your 2 existing messages** in `hermes_ai` database will show up automatically
- **No code changes needed** - your localhost code works as-is on Render!

## Need Help?

Check Render logs:
- Go to your service dashboard
- Click "Logs" tab
- See real-time server output
