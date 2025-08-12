# 🚀 Blockchain Explorer Deployment Guide

This guide will help you deploy your blockchain explorer to production using Netlify (frontend) and Railway (backend).

## 📋 Prerequisites

- GitHub account
- Netlify account (free)
- Railway account (free)
- Node.js 18+ installed locally

## 🎯 Deployment Strategy

- **Frontend**: Netlify (static hosting)
- **Backend**: Railway (Node.js hosting)
- **Database**: Railway managed PostgreSQL (optional)

## 🚀 Step 1: Deploy Backend to Railway

### 1.1 Prepare Backend
```bash
cd backend
# Ensure all dependencies are installed
yarn install
# Test build locally
yarn build
```

### 1.2 Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect the Dockerfile and deploy
6. Wait for deployment to complete
7. Note the generated URL (e.g., `https://your-app.railway.app`)

### 1.3 Configure Environment Variables
In Railway dashboard, add these environment variables:
```bash
NODE_ENV=production
PORT=3001
# Add your blockchain node URL
BLOCKCHAIN_NODE_URL=wss://your-node-url.com
# Add any other required environment variables
```

## 🌐 Step 2: Deploy Frontend to Netlify

### 2.1 Prepare Frontend
```bash
cd frontend
# Install dependencies
yarn install
# Test build locally
yarn build
```

### 2.2 Update Environment Variables
Update `frontend/.env.production` with your Railway backend URL:
```bash
VITE_API_URL=https://your-app.railway.app
```

### 2.3 Deploy to Netlify
1. Go to [Netlify.com](https://netlify.com)
2. Sign in with GitHub
3. Click "New site from Git"
4. Select your repository
5. Configure build settings:
   - **Build command**: `cd frontend && yarn build`
   - **Publish directory**: `frontend/dist`
6. Click "Deploy site"

### 2.4 Configure Environment Variables
In Netlify dashboard:
1. Go to Site settings → Environment variables
2. Add:
   ```
   VITE_API_URL=https://your-app.railway.app
   ```

## 🔧 Step 3: Configure CORS

### 3.1 Update Backend CORS
In `backend/src/main.ts`, ensure CORS is configured for your Netlify domain:
```typescript
app.enableCors({
  origin: [
    'https://your-app.netlify.app',
    'http://localhost:3000' // for local development
  ],
  credentials: true
});
```

## 🌍 Step 4: Test Deployment

### 4.1 Test Backend
```bash
curl https://your-app.railway.app/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 4.2 Test Frontend
1. Visit your Netlify URL
2. Test the search functionality
3. Verify WebSocket connections work
4. Check that all pages load correctly

## 🔄 Step 5: Continuous Deployment

### 5.1 Automatic Deployments
Both Netlify and Railway will automatically deploy when you push to your main branch.

### 5.2 Manual Deployments
- **Railway**: Trigger redeploy from dashboard
- **Netlify**: Trigger deploy from dashboard or push to main branch

## 📊 Step 6: Monitoring

### 6.1 Railway Monitoring
- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for errors

### 6.2 Netlify Monitoring
- View build logs
- Monitor performance
- Set up form submissions (if needed)

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check Railway logs
- Verify environment variables
- Ensure Dockerfile is correct

#### Frontend Can't Connect to Backend
- Verify CORS configuration
- Check environment variables
- Test backend health endpoint

#### WebSocket Issues
- Ensure backend supports WebSocket
- Check firewall/proxy settings
- Verify SSL certificates

### Debug Commands
```bash
# Check backend logs
railway logs

# Test backend locally
cd backend && yarn start:prod

# Test frontend locally
cd frontend && yarn dev

# Check environment variables
echo $VITE_API_URL
```

## 💰 Cost Estimation

### Free Tier Limits
- **Netlify**: 100GB bandwidth/month, unlimited sites
- **Railway**: $5 credit/month, ~500 hours of runtime

### Paid Plans
- **Netlify**: $19/month for Pro plan
- **Railway**: Pay-as-you-use, typically $5-20/month

## 🔒 Security Considerations

1. **Environment Variables**: Never commit secrets to Git
2. **CORS**: Restrict origins to your domains only
3. **Rate Limiting**: Implement API rate limiting
4. **HTTPS**: Both platforms provide SSL certificates
5. **Monitoring**: Set up error tracking and logging

## 📚 Additional Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

## 🎉 Success!

Once deployed, your blockchain explorer will be available at:
- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.railway.app`

Share the frontend URL with users to start exploring your blockchain!
