# Google Cloud Build - Frontend Deployment

This document explains how to use `cloudbuild-frontend.yaml` to automatically build and deploy the frontend to Google Cloud Storage.

## 📋 Prerequisites

1. **Google Cloud Project** with billing enabled
2. **Cloud Build API** enabled:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   ```
3. **GCS Bucket** created (or will be created automatically)
4. **Cloud Build Service Account** has Storage Admin permissions:
   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
     --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
     --role="roles/storage.admin"
   ```

## 🚀 Quick Start

### Method 1: Command Line

```bash
# From project root directory
gcloud builds submit --config=frontend/cloudbuild-frontend.yaml \
  --substitutions=_GCS_BUCKET_NAME=ai-interviewer-frontend,_BACKEND_URL=https://your-backend-service.run.app
```

### Method 2: Cloud Build UI

1. Go to [Cloud Build Console](https://console.cloud.google.com/cloud-build)
2. Click **"Triggers"** → **"Create Trigger"**
3. Connect your repository (GitHub, GitLab, etc.)
4. Set configuration:
   - **Type**: Cloud Build configuration file
   - **Location**: `frontend/cloudbuild-frontend.yaml`
5. Add substitutions:
   - `_GCS_BUCKET_NAME`: `ai-interviewer-frontend`
   - `_BACKEND_URL`: `https://your-backend-service.run.app`
6. Save and run trigger

## 🔧 Configuration

### Substitutions

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `_GCS_BUCKET_NAME` | GCS bucket name for frontend files | `ai-interviewer-frontend` | Yes |
| `_BACKEND_URL` | Backend API URL for frontend to connect | `https://aiinterviewerbackend-2.onrender.com` | Yes |

### Custom Substitutions

Override defaults when running:

```bash
gcloud builds submit --config=frontend/cloudbuild-frontend.yaml \
  --substitutions=_GCS_BUCKET_NAME=my-custom-bucket,_BACKEND_URL=https://api.example.com
```

## 📝 Build Steps

The Cloud Build configuration performs these steps:

1. **Install Dependencies**: Runs `npm install` in frontend directory
2. **Build Application**: Runs `npm run build` with production environment
3. **Upload Files**: Uploads all files from `dist/` to GCS bucket
4. **Set Content Types**: Configures correct MIME types for HTML, JS, CSS
5. **Configure Website**: Sets up static website hosting
6. **Set Permissions**: Makes bucket publicly readable

## 🔄 Automated Deployment

### GitHub Integration

1. **Create Cloud Build Trigger**:
   ```bash
   gcloud builds triggers create github \
     --repo-name=YOUR_REPO \
     --repo-owner=YOUR_GITHUB_USERNAME \
     --branch-pattern="^main$" \
     --build-config=frontend/cloudbuild-frontend.yaml \
     --substitutions=_GCS_BUCKET_NAME=ai-interviewer-frontend,_BACKEND_URL=https://your-backend.run.app
   ```

2. **Push to main branch** - Build will trigger automatically

### GitLab Integration

Similar process, use `gitlab` instead of `github` in the trigger command.

## 🎯 Build Output

After successful build:

- **Frontend URL**: `https://storage.googleapis.com/YOUR_BUCKET_NAME/index.html`
- **Public Access**: Enabled for all files
- **Content Types**: Properly configured

## 🐛 Troubleshooting

### Build Fails: "Permission Denied"

**Solution**: Grant Storage Admin role to Cloud Build service account:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:YOUR_PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/storage.admin"
```

### Build Fails: "Bucket Not Found"

**Solution**: Create bucket first or ensure bucket name is correct:
```bash
gsutil mb -p YOUR_PROJECT_ID -c STANDARD -l us-central1 gs://YOUR_BUCKET_NAME
```

### Build Fails: "npm install" Errors

**Solution**: Check Node.js version compatibility. The build uses Node 18. Update `cloudbuild-frontend.yaml` if needed:
```yaml
- name: 'node:20'  # Change from node:18 to node:20
```

### Files Not Uploading Correctly

**Solution**: Check build logs:
```bash
gcloud builds list --limit=1
gcloud builds log BUILD_ID
```

## 📊 Monitoring

### View Build History

```bash
gcloud builds list --limit=10
```

### View Build Logs

```bash
gcloud builds log BUILD_ID
```

### Real-time Build Status

Visit: [Cloud Build Console](https://console.cloud.google.com/cloud-build)

## 🔐 Security Best Practices

1. **Use Secrets Manager** for sensitive values:
   ```bash
   # Store backend URL as secret
   echo -n "https://your-backend.run.app" | \
     gcloud secrets create backend-url --data-file=-
   
   # Reference in cloudbuild.yaml
   # (Requires additional configuration)
   ```

2. **Restrict Bucket Access**: Consider using Cloud CDN with signed URLs instead of public access

3. **Enable Build Logs**: Keep logs for audit purposes

## 📚 Related Documentation

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [GCS Static Website Hosting](https://cloud.google.com/storage/docs/hosting-static-website)
- [Cloud Build Substitutions](https://cloud.google.com/build/docs/configuring-builds/substitute-variable-values)

## 🆘 Support

For issues:
1. Check Cloud Build logs
2. Verify bucket permissions
3. Check substitution values
4. Review build configuration file syntax

---

**Last Updated**: 2025-01-27

