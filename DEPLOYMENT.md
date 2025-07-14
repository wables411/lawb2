# WebSocket Server Deployment Guide

## Deploy to Railway (Free)

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app/)
2. Sign up with GitHub
3. Get $5 free credit/month

### Step 2: Deploy Your Server
1. **Connect your GitHub repo** to Railway
2. **Create new service** from GitHub repo
3. **Set environment variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   PORT=8080
   ```
4. **Deploy** - Railway will automatically run `node simple-websocket-server.js`

### Step 3: Get Your WebSocket URL
- Railway will give you a URL like: `https://your-app.railway.app`
- Your WebSocket URL will be: `wss://your-app.railway.app`

## Alternative: Deploy to Render (Free)

### Step 1: Create Render Account
1. Go to [Render.com](https://render.com/)
2. Sign up with GitHub
3. Free tier: 750 hours/month

### Step 2: Deploy
1. **New Web Service** from GitHub repo
2. **Build Command**: `npm install`
3. **Start Command**: `node simple-websocket-server.js`
4. **Environment Variables**:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Alternative: Deploy to Heroku (Free)

### Step 1: Create Heroku Account
1. Go to [Heroku.com](https://heroku.com/)
2. Sign up (free tier available)

### Step 2: Deploy
1. **Install Heroku CLI**
2. **Login**: `heroku login`
3. **Create app**: `heroku create your-app-name`
4. **Set environment variables**:
   ```bash
   heroku config:set SUPABASE_URL=your_supabase_url
   heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
5. **Deploy**: `git push heroku main`

## Test Your Deployment

Once deployed, test with:
```bash
curl https://your-app-url.railway.app
```

Should return: "WebSocket server is running"

## Update Your Frontend

After deployment, update your frontend to use the WebSocket server instead of Supabase real-time. 