# 🔧 Fix: Cloud Run 403 Authentication Error

## Problem

Getting 403 error:
```
The request was not authenticated. Either allow unauthenticated invocations or set the proper Authorization header.
```

## Root Cause

Cloud Run service is deployed but requires authentication. For a public frontend, we need to allow unauthenticated access.

## ✅ Solution

Allow unauthenticated invocations on the Cloud Run service.

### Method 1: Using gcloud CLI

```bash
gcloud run services add-iam-policy-binding aiinterviewfrontend \
  --region=asia-south2 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=eastern-team-480811-e6
```

### Method 2: Using Cloud Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Click on service: `aiinterviewfrontend`
3. Click **"Permissions"** tab
4. Click **"Add Principal"**
5. Enter: `allUsers`
6. Select role: **"Cloud Run Invoker"**
7. Click **"Save"**

### Method 3: Update Cloud Build Trigger

If deploying via Cloud Build, add this to your deployment step or update the service after deployment:

```yaml
# In cloudbuild.yaml or deployment script
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim'
  entrypoint: 'gcloud'
  args:
    - 'run'
    - 'services'
    - 'add-iam-policy-binding'
    - 'aiinterviewfrontend'
    - '--region=asia-south2'
    - '--member=allUsers'
    - '--role=roles/run.invoker'
```

## Quick Fix Command

Run this command to fix immediately:

```bash
gcloud run services add-iam-policy-binding aiinterviewfrontend \
  --region=asia-south2 \
  --member="allUsers" \
  --role="roles/run.invoker"
```

## Verification

After running the command:
1. Wait a few seconds
2. Visit: https://aiinterviewfrontend-310576915040.asia-south2.run.app/
3. Should load without 403 error

## Security Note

Allowing `allUsers` makes the service publicly accessible. This is appropriate for a frontend application but ensure:
- No sensitive endpoints are exposed
- Backend APIs have proper authentication
- CORS is properly configured

---

**Last Updated**: 2025-01-27




