# Stockfish API Deployment Guide

## Deploy to Railway (Recommended)

1. **Go to [Railway.app](https://railway.app/) and create an account**

2. **Create a new project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account and select this repository

3. **Deploy**
   - Railway will automatically detect the Dockerfile and deploy
   - The API will be available at: `https://your-app-name.up.railway.app`

4. **Get your API URL**
   - In Railway dashboard, go to your project
   - Copy the generated URL (e.g., `https://your-app-name.up.railway.app`)

## Update Frontend

Once deployed, update your frontend's World-Class AI endpoint to:
```
https://your-app-name.up.railway.app/move
```

## Test the API

Test your deployed API:
```bash
curl -X POST https://your-app-name.up.railway.app/move \
  -H "Content-Type: application/json" \
  -d '{"fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w", "movetime": 1000}'
```

## Alternative Platforms

### Render
1. Go to [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repo
4. Set build command: `docker build -t stockfish-api .`
5. Set start command: `docker run -p 3001:3001 stockfish-api`

### Fly.io
1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. Run: `fly launch`
3. Deploy: `fly deploy`

## Result

Your World-Class AI will now use the real Stockfish engine and be truly unbeatable by any human player. 