# 🔧 Fix: Cloud Run Container Failed to Start

## Problem

The error indicates that the container failed to start and listen on port 8080:
```
The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable
```

## Root Cause

Cloud Run requires containers to listen on the `PORT` environment variable (defaults to 8080), but the Dockerfile was configured to listen on port 80.

## ✅ Solution

The Dockerfile has been updated to:
1. Use `nginx.conf.template` with `${PORT}` placeholder
2. Use `envsubst` to substitute the PORT environment variable at runtime
3. Configure nginx to listen on the PORT provided by Cloud Run

## Files Updated

1. **Dockerfile** - Now uses PORT environment variable
2. **nginx.conf.template** - Template with `${PORT}` placeholder
3. **nginx.conf** - Updated to use port 8080 (fallback)

## How It Works

1. Cloud Run sets `PORT=8080` environment variable
2. The startup script uses `envsubst` to replace `${PORT}` in the nginx template
3. Nginx starts listening on the correct port

## Testing Locally

```bash
# Build the image
docker build -t frontend-test --build-arg VITE_API_URL=https://your-backend.run.app .

# Run with PORT environment variable
docker run -p 8080:8080 -e PORT=8080 frontend-test

# Test
curl http://localhost:8080
```

## Deployment

After pushing the updated Dockerfile:

1. **Cloud Build will automatically rebuild** if using triggers
2. **Or manually rebuild**:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/frontend-image
   gcloud run deploy aiinterviewfrontend \
     --image gcr.io/PROJECT_ID/frontend-image \
     --platform managed \
     --region us-central1 \
     --port 8080
   ```

## Verification

After deployment, check:
1. Cloud Run service is healthy
2. Container logs show nginx starting successfully
3. Service URL is accessible

---

**Last Updated**: 2025-01-27




