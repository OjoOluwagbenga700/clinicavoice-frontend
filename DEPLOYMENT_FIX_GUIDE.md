# 🚀 Complete Deployment Fix Guide

## Problem Summary
After redeploying backend and frontend, the `/patients` page shows blank.

## Root Cause
**Missing environment variables in AWS Amplify Console**

When you redeploy the backend with Terraform, it creates NEW resource IDs (User Pool, API Gateway, etc.). The old environment variables in Amplify Console point to the OLD (destroyed) resources.

## ✅ Complete Fix (Step-by-Step)

### Step 1: Get Current Backend Values

Your current backend values (from Terraform):

```bash
API Gateway:     https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod
User Pool ID:    us-east-1_cSlyoY7Kk
Client ID:       bri9u1lntlnhps6c39fcmnq88
Identity Pool:   us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee
S3 Bucket:       clinicavoice-storage-prod-uulak9at
Region:          us-east-1
```

### Step 2: Update Amplify Environment Variables

1. **Open AWS Amplify Console**
   - Go to: https://console.aws.amazon.com/amplify/
   - Select your app

2. **Navigate to Environment Variables**
   - Click "Environment variables" in left sidebar
   - Click "Manage variables" button

3. **Update/Add These 6 Variables**

   | Variable Name | Value |
   |--------------|-------|
   | `VITE_API_ENDPOINT` | `https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod` |
   | `VITE_AWS_USER_POOL_ID` | `us-east-1_cSlyoY7Kk` |
   | `VITE_AWS_USER_POOL_CLIENT_ID` | `bri9u1lntlnhps6c39fcmnq88` |
   | `VITE_AWS_IDENTITY_POOL_ID` | `us-east-1:4378ce6e-50a9-43f3-aa8a-9b09c25ddcee` |
   | `VITE_S3_BUCKET` | `clinicavoice-storage-prod-uulak9at` |
   | `VITE_AWS_REGION` | `us-east-1` |

4. **Click "Save"**

### Step 3: Trigger New Build

**CRITICAL:** Environment variables only apply to NEW builds!

**Option A - Push Empty Commit:**
```bash
git commit --allow-empty -m "Update environment variables"
git push
```

**Option B - Redeploy in Console:**
1. Go to Amplify Console → Your App
2. Click "Hosting" in left sidebar
3. Find the latest build
4. Click "Redeploy this version"

### Step 4: Monitor Build

1. Watch the build progress in Amplify Console
2. Wait for "Provision", "Build", and "Deploy" to complete (green checkmarks)
3. Build typically takes 3-5 minutes

### Step 5: Clear Browser Cache

**Very Important!** Your browser cached the broken version.

**Chrome/Edge/Brave:**
- Windows: `Ctrl + Shift + Delete`
- Mac: `Cmd + Shift + Delete`
- Select "Cached images and files"
- Click "Clear data"

**Or use Incognito/Private mode** to test without cache.

### Step 6: Test the Application

1. Open your Amplify app URL
2. Open browser console (F12)
3. Look for: `✅ Amplify configured successfully`
4. You should see the login page

## 🧪 Verification

### Test Backend is Accessible
```bash
curl https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod/patients
```

**Expected:** `{"message":"Unauthorized"}` or `{"message":"Forbidden"}`  
**This is GOOD!** It means the API is working (just needs authentication).

**Bad:** Connection timeout or 404  
**This means** there's a backend deployment issue.

### Check Browser Console

After the page loads, you should see:
```
✅ Amplify configured successfully with environment-based config
🔒 Configuration: {
  environment: 'production',
  apiEndpoint: 'https://oa5uhmedaj.execute-api.us-east-1.amazonaws.com/prod',
  region: 'us-east-1',
  ...
}
```

If you see this error instead:
```
❌ Missing required environment variables: VITE_API_ENDPOINT, ...
```
Then the environment variables weren't set correctly or the build didn't pick them up.

## 🐛 Troubleshooting

### Issue: Still Blank After Following All Steps

**Check 1: Did you trigger a NEW build?**
- Old builds don't have the new environment variables
- Verify in Amplify Console that a new build ran AFTER you saved the variables

**Check 2: Did you clear browser cache?**
- Try Incognito/Private mode
- Or completely clear cache

**Check 3: Check Amplify Build Logs**
1. Go to Amplify Console
2. Click on the latest build
3. Expand "Build" section
4. Look for environment variables being set
5. Look for any error messages

**Check 4: Verify Variables in Amplify Console**
- Go back to Environment variables
- Make sure all 6 are there
- Check for typos (case-sensitive!)
- No extra spaces in values

### Issue: "Phone is not defined" Error

This was fixed in the code. If you still see it:
1. Make sure you pushed the latest code
2. Verify `src/components/PatientCard.jsx` has the fix
3. Trigger a new build

### Issue: Can't Login

If the page loads but login fails:
1. Check that User Pool ID and Client ID are correct
2. Make sure you're using the right credentials
3. Check Cognito Console to verify the user pool exists

### Issue: API Calls Fail

If you can login but API calls fail:
1. Verify `VITE_API_ENDPOINT` is correct
2. Test the endpoint with curl (see above)
3. Check API Gateway in AWS Console
4. Check Lambda function logs in CloudWatch

## 📋 Quick Reference

### Get Latest Terraform Outputs
```bash
cd backend/terraform
terraform output -json
```

### Run Verification Script
```bash
./verify-amplify-deployment.sh
```

### Test Local Development
```bash
npm run dev
```
(The `.env.local` file has been updated with current values)

### View Amplify Build Logs
```bash
# In Amplify Console, or use AWS CLI:
aws amplify list-apps
aws amplify list-jobs --app-id <your-app-id> --branch-name main
```

## 📞 Need Help?

If you're still seeing a blank page after following all steps:

1. **Check browser console** (F12) and share any error messages
2. **Check Amplify build logs** and share any errors
3. **Verify environment variables** are set in Amplify Console
4. **Test the API endpoint** with curl and share the response

## ✨ Success Indicators

You'll know it's working when:
- ✅ Page loads (not blank)
- ✅ You see the login page
- ✅ Browser console shows "Amplify configured successfully"
- ✅ No red errors in console
- ✅ You can login with credentials
- ✅ After login, you see the dashboard
- ✅ You can navigate to /patients and see the patient list

## 🎯 Summary

The fix is simple but requires ALL these steps:
1. ✅ Update environment variables in Amplify Console
2. ✅ Trigger a NEW build
3. ✅ Wait for build to complete
4. ✅ Clear browser cache
5. ✅ Test the application

**Most common mistake:** Forgetting to trigger a new build after updating variables!
