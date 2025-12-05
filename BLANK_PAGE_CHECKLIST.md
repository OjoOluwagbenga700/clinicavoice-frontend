# 🔧 Blank Page Troubleshooting Checklist

You've set environment variables but still see a blank page. Follow this checklist:

## ✅ Checklist (Do in Order)

### 1. Verify Environment Variables in Amplify Console

Go to: **AWS Amplify Console → Your App → Environment variables**

Check that ALL 6 variables are present with EXACT values:

- [ ] `VITE_API_ENDPOINT` = `https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod`
- [ ] `VITE_AWS_USER_POOL_ID` = `us-east-1_cSlyoY7Kk`
- [ ] `VITE_AWS_USER_POOL_CLIENT_ID` = `bri9u1lntlnhps6c39fcmnq88`
- [ ] `VITE_AWS_IDENTITY_POOL_ID` = `us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee`
- [ ] `VITE_S3_BUCKET` = `clinicavoice-storage-prod-uulak9at`
- [ ] `VITE_AWS_REGION` = `us-east-1`

**Common mistakes:**
- ❌ Typo in variable name (e.g., `VITE_API_URL` instead of `VITE_API_ENDPOINT`)
- ❌ Extra spaces before/after values
- ❌ Wrong values (old deployment IDs)

### 2. Push the Code Fix

The Phone icon fix needs to be deployed:

```bash
# Check if you have uncommitted changes
git status

# Add all changes
git add .

# Commit with a message
git commit -m "Fix Phone icon import issue"

# Push to trigger Amplify build
git push
```

- [ ] Code pushed to repository
- [ ] Amplify build triggered automatically

### 3. Wait for Build to Complete

Go to: **AWS Amplify Console → Your App → Build history**

- [ ] New build started (should show "In Progress")
- [ ] Wait for all phases to complete:
  - [ ] Provision (green checkmark)
  - [ ] Build (green checkmark)
  - [ ] Deploy (green checkmark)
  - [ ] Verify (green checkmark)

**This takes 3-5 minutes.** Don't test until it's done!

### 4. Check Build Logs for Environment Variables

In the build that just completed:

1. Click on the build
2. Expand the "Build" section
3. Look for environment variables being set

You should see lines like:
```
Environment variables:
VITE_API_ENDPOINT=https://...
VITE_AWS_USER_POOL_ID=us-east-1_...
```

- [ ] Environment variables appear in build logs
- [ ] No build errors

**If variables are NOT in the logs:**
- The build is using an old configuration
- Try clicking "Redeploy this version" to force a rebuild

### 5. Clear Browser Cache COMPLETELY

**This is critical!** Your browser cached the broken version.

**Chrome/Edge/Brave:**
1. Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
2. Select "All time" for time range
3. Check "Cached images and files"
4. Click "Clear data"

**Or use Incognito/Private mode:**
- Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- This bypasses cache completely

- [ ] Browser cache cleared OR using Incognito mode

### 6. Test the Application

1. Open your Amplify app URL
2. **Immediately open browser console** (press F12)
3. Look at the console messages

**What you should see:**
```
✅ Amplify configured successfully with environment-based config
🔒 Configuration: { environment: 'production', ... }
```

**What you should NOT see:**
```
❌ Missing required environment variables: ...
Uncaught ReferenceError: Phone is not defined
```

- [ ] Page loads (not blank)
- [ ] Console shows "Amplify configured successfully"
- [ ] No red errors in console

### 7. If Still Blank - Get Diagnostic Info

Open browser console (F12) and look for:

**Error messages:**
- What's the exact error?
- Is it about environment variables?
- Is it about Phone not defined?
- Is it something else?

**Network tab:**
- Are there any failed requests?
- What's the status code?

**Share this information:**
1. Screenshot of console errors
2. Screenshot of Network tab
3. Screenshot of Amplify environment variables page
4. Screenshot of latest build logs

## 🎯 Most Common Issues

### Issue 1: "Phone is not defined"
**Cause:** Old code is deployed  
**Fix:** Push the code fix (Step 2) and wait for new build

### Issue 2: "Missing required environment variables"
**Cause:** Environment variables not set or build didn't pick them up  
**Fix:** 
1. Verify variables in Amplify Console (Step 1)
2. Trigger new build by pushing code or clicking "Redeploy"
3. Check build logs to confirm variables are there (Step 4)

### Issue 3: Still seeing old broken version
**Cause:** Browser cache  
**Fix:** Clear cache completely or use Incognito mode (Step 5)

### Issue 4: Build succeeds but page is blank with no errors
**Cause:** Might be a different issue  
**Fix:** 
1. Check browser console for ANY errors
2. Check Network tab for failed requests
3. Try accessing the app from a different device/network

## 🔍 Run Diagnostic Script

Run this to check everything:

```bash
./diagnose-amplify-issue.sh
```

This will:
- ✅ Verify the code fix is present
- ✅ Show you the correct environment variable values
- ✅ Test your API endpoint
- ✅ Build locally to check for errors

## 📞 Still Need Help?

If you've completed ALL steps above and still see a blank page:

1. Run the diagnostic script: `./diagnose-amplify-issue.sh`
2. Open the app in Incognito mode
3. Open browser console (F12)
4. Take screenshots of:
   - Console errors
   - Network tab
   - Amplify environment variables page
   - Latest build logs
5. Share these screenshots

The error message in the console will tell us exactly what's wrong.
