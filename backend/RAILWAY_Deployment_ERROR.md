# Railway Deployment Fix

## Latest Fix (Build Failure)

### Problem
Build was failing due to multi-stage Docker build complexity and missing system dependencies.

### Solution Applied
1. **Simplified Dockerfile** - Single stage build (no multi-stage complexity)
2. **Added system dependencies** - `libpq-dev` for psycopg2, `build-essential` for bcrypt
3. **Cleaned requirements.txt** - Removed duplicate httpx, removed testing deps
4. **Added Docker HEALTHCHECK** - Built-in container health monitoring

## Previous Fix (Health Check Timeout)

### Problem
Railway deployment was failing with health check timeout errors.

### Solution Applied
1. Simplified Dockerfile CMD to `["python", "main.py"]`
2. Added startup logging to stdout for Railway visibility
3. Reduced `healthcheckTimeout` from 600s to 120s

## Deployment Checklist

Before deploying, verify:
- [ ] All environment variables are set in Railway dashboard:
  - `ENVIRONMENT=production`
  - `OPENROUTER_API_KEY`
  - `COHERE_API_KEY` (if using embeddings)
  - `FRONTEND_URL` (your Vercel frontend URL)
- [ ] PORT is automatically set by Railway (don't set manually)

## Verification

After deployment, check:
1. Railway deploy logs show "Starting Physical AI Backend..."
2. Health endpoint returns 200: `curl https://your-app.railway.app/api/v1/health`
3. Root endpoint works: `curl https://your-app.railway.app/`

## Troubleshooting

If health check still fails:
1. Check Railway deploy logs for import errors
2. Verify environment variables are set
3. Try the detailed health endpoint: `/api/v1/health/detailed`
