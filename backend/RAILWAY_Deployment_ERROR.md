# Railway Deployment Fix - Health Check Timeout

## Problem
Railway deployment was failing with health check timeout errors. The app was not responding to health check requests at `/api/v1/health`.

## Root Causes Identified

1. **Fragile Dockerfile CMD**: The Python one-liner was difficult to debug and could fail silently
   ```dockerfile
   # OLD - problematic
   CMD python -c "import os; port = int(os.environ.get('PORT', 8080)); ..."
   ```

2. **No startup logging**: Import errors and startup failures were not visible in Railway logs

3. **Excessive health timeout**: 600s timeout was too long; issues weren't surfaced quickly

## Fixes Applied

### 1. Simplified Dockerfile CMD (`Dockerfile:47`)
```dockerfile
# NEW - clean and debuggable
CMD ["python", "main.py"]
```

### 2. Added Startup Logging (`main.py`)
- Configured logging to stdout for Railway visibility
- Added import error handling with clear error messages
- Log Python version and PORT environment on startup

### 3. Updated Railway Config (`railway.json`)
- Reduced `healthcheckTimeout` from 600s to 120s
- Increased `restartPolicyMaxRetries` to 5

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
