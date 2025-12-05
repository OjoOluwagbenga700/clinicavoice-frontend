# Amplify Environment Variables Checklist

## ⚠️ CRITICAL: Verify ALL Environment Variables in Amplify Console

Your blank page issue is caused by missing environment variables. The app crashes on load when these are not set.

## Required Environment Variables

Go to **AWS Amplify Console** → Your App → **Environment variables** and verify these are set:

### 1. API Endpoint
```
VITE_API_ENDPOINT=https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod
```

### 2. Cognito User Pool ID
```
VITE_AWS_USER_POOL_ID=us-east-1_cSlyoY7Kk
```

### 3. Cognito User Pool Client ID
```
VITE_AWS_USER_POOL_CLIENT_ID=bri9u1lntlnhps6c39fcmnq88
```

### 4. Cognito Identity Pool ID
```
VITE_AWS_IDENTITY_POOL_ID=us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee
```

### 5. S3 Bucket Name
```
VITE_S3_BUCKET=clinicavoice-storage-prod-uulak9at
```

### 6. AWS Region
```
VITE_AWS_REGION=us-east-1
```

## How to Add/Update Environment Variables in Amplify

1. Go to AWS Amplify Console
2. Select your app
3. Click **Environment variables** in the left sidebar
4. Click **Manage variables**
5. Add or update each variable above
6. Click **Save**
7. **Trigger a new build** (Amplify → Hosting → Click "Redeploy this version" or push a new commit)

## Verification Steps

After adding the environment variables and redeploying:

1. **Wait for build to complete** (check Amplify Console build logs)
2. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
3. **Open browser console** (F12) and check for errors
4. **Visit the app** - you should see the login page, not a blank page

## Common Issues

### Issue: Still seeing blank page after adding variables
**Solution:** 
- Make sure you triggered a NEW build after adding variables
- Old builds don't have the new environment variables
- Clear browser cache completely

### Issue: Console shows "Missing required environment variables"
**Solution:**
- Double-check variable names (they're case-sensitive)
- Make sure there are no extra spaces in the values
- Verify all 6 variables are present

### Issue: App loads but can't connect to API
**Solution:**
- Check that VITE_API_ENDPOINT is correct
- Test the endpoint: `curl https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod/patients`
- Should return 401 or 403 (expected without auth token)

## Testing Locally

To test locally with these values, create a `.env.local` file:

```bash
VITE_API_ENDPOINT=https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_USER_POOL_ID=us-east-1_cSlyoY7Kk
VITE_AWS_USER_POOL_CLIENT_ID=bri9u1lntlnhps6c39fcmnq88
VITE_AWS_IDENTITY_POOL_ID=us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee
VITE_S3_BUCKET=clinicavoice-storage-prod-uulak9at
VITE_AWS_REGION=us-east-1
```

Then run:
```bash
npm run dev
```

## Quick Test Script

Run this to verify your backend is accessible:

```bash
./verify-amplify-deployment.sh
```

This will show you all the values and test the API endpoint.
