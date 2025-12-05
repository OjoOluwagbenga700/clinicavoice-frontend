# Debugging Blank Page on /patients

## Root Cause
The blank page is almost certainly caused by **missing environment variables** in Amplify Console.

## What Happens
1. App loads
2. `amplifyConfig.js` tries to read environment variables
3. Variables are missing/undefined
4. Code throws an error: "Missing required environment variables"
5. React crashes before rendering anything
6. You see a blank page

## How to Fix

### Step 1: Add Environment Variables to Amplify Console

1. Open AWS Amplify Console
2. Go to your app
3. Click **Environment variables** (left sidebar)
4. Click **Manage variables**
5. Add these 6 variables:

```
VITE_API_ENDPOINT=https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod
VITE_AWS_USER_POOL_ID=us-east-1_cSlyoY7Kk
VITE_AWS_USER_POOL_CLIENT_ID=bri9u1lntlnhps6c39fcmnq88
VITE_AWS_IDENTITY_POOL_ID=us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee
VITE_S3_BUCKET=clinicavoice-storage-prod-uulak9at
VITE_AWS_REGION=us-east-1
```

6. Click **Save**

### Step 2: Trigger New Build

**IMPORTANT:** Adding variables doesn't update existing builds!

Option A: Push a new commit
```bash
git commit --allow-empty -m "Trigger rebuild with env vars"
git push
```

Option B: Redeploy in Amplify Console
- Go to Amplify Console → Hosting
- Find the latest build
- Click "Redeploy this version"

### Step 3: Wait for Build to Complete

- Watch the build logs in Amplify Console
- Build should take 2-5 minutes
- Make sure it completes successfully

### Step 4: Clear Browser Cache

**Critical step!** Your browser may have cached the broken version.

Chrome/Edge:
- Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- Select "Cached images and files"
- Click "Clear data"

Or use Incognito/Private mode to test.

### Step 5: Test

1. Open your Amplify app URL
2. Open browser console (F12)
3. Look for the message: "✅ Amplify configured successfully"
4. You should see the login page, not a blank page

## How to Verify Environment Variables Are Set

### In Browser Console (after successful load):
You should see:
```
✅ Amplify configured successfully with environment-based config
🔒 Configuration: { environment: 'production', apiEndpoint: 'https://...', ... }
```

### If Variables Are Missing:
You'll see:
```
❌ Missing required environment variables: VITE_API_ENDPOINT, VITE_AWS_USER_POOL_ID, ...
```

## Still Blank After Following Steps?

### Check Build Logs
1. Go to Amplify Console
2. Click on the latest build
3. Expand "Build" section
4. Look for errors in the logs
5. Verify environment variables are printed during build

### Check Browser Console
1. Open the blank page
2. Press F12 to open console
3. Look for red error messages
4. Share the error message if you need help

### Verify API Endpoint
Test if your backend is accessible:
```bash
curl https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod/patients
```

Expected response: `{"message":"Unauthorized"}` or `{"message":"Forbidden"}`
This is good! It means the API is working.

Bad response: Connection timeout or 404
This means there's a backend issue.

## Common Mistakes

❌ **Adding variables but not rebuilding**
- Variables only apply to NEW builds
- You must trigger a rebuild after adding them

❌ **Typos in variable names**
- Must be exactly: `VITE_API_ENDPOINT` (not `VITE_API_URL`)
- Case-sensitive!

❌ **Not clearing browser cache**
- Browser caches the broken version
- Use Incognito mode or clear cache

❌ **Wrong Amplify app**
- Make sure you're editing the correct app in Amplify Console
- Check the app name matches your deployment

## Need More Help?

Run the verification script:
```bash
./verify-amplify-deployment.sh
```

This will show you all the correct values and test your API endpoint.
