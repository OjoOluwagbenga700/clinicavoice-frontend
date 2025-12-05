#!/bin/bash

echo "🔍 Amplify Deployment Diagnostic Tool"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Checking Git Status"
echo "--------------------------------"
git status --short
echo ""

echo "📋 Step 2: Checking Latest Commit"
echo "--------------------------------"
git log -1 --oneline
echo ""

echo "📋 Step 3: Verifying PatientCard.jsx Fix"
echo "--------------------------------"
if grep -q 'import PhoneIcon from "@mui/icons-material/Phone"' src/components/PatientCard.jsx; then
    echo "✅ PhoneIcon import fix is present"
else
    echo "❌ PhoneIcon import fix is MISSING - this will cause errors!"
fi
echo ""

echo "📋 Step 4: Checking for Other Potential Import Issues"
echo "--------------------------------"
echo "Searching for problematic MUI icon imports..."
if grep -r "Phone as PhoneIcon" src/ 2>/dev/null | grep -v node_modules; then
    echo "⚠️  Found problematic imports above"
else
    echo "✅ No problematic icon imports found"
fi
echo ""

echo "📋 Step 5: Backend Configuration"
echo "--------------------------------"
cd backend/terraform
echo "API Gateway URL:"
terraform output -raw api_gateway_url 2>/dev/null || echo "❌ Not found"
echo ""
echo "User Pool ID:"
terraform output -raw cognito_user_pool_id 2>/dev/null || echo "❌ Not found"
echo ""
echo "Client ID:"
terraform output -raw cognito_user_pool_client_id 2>/dev/null || echo "❌ Not found"
echo ""
cd ../..

echo "📋 Step 6: Required Amplify Environment Variables"
echo "--------------------------------"
echo "Copy these EXACT values to Amplify Console:"
echo ""
echo "VITE_API_ENDPOINT=$(cd backend/terraform && terraform output -raw api_gateway_url 2>/dev/null)"
echo "VITE_AWS_USER_POOL_ID=$(cd backend/terraform && terraform output -raw cognito_user_pool_id 2>/dev/null)"
echo "VITE_AWS_USER_POOL_CLIENT_ID=$(cd backend/terraform && terraform output -raw cognito_user_pool_client_id 2>/dev/null)"
echo "VITE_AWS_IDENTITY_POOL_ID=$(cd backend/terraform && terraform output -raw cognito_identity_pool_id 2>/dev/null)"
echo "VITE_S3_BUCKET=$(cd backend/terraform && terraform output -raw s3_bucket_name 2>/dev/null)"
echo "VITE_AWS_REGION=us-east-1"
echo ""

echo "📋 Step 7: Testing Local Build"
echo "--------------------------------"
echo "Building project locally to check for errors..."
npm run build 2>&1 | tail -20
BUILD_EXIT_CODE=${PIPESTATUS[0]}

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Local build succeeded"
else
    echo ""
    echo "❌ Local build FAILED - fix these errors before deploying"
    exit 1
fi
echo ""

echo "📋 Step 8: Testing API Endpoint"
echo "--------------------------------"
API_URL=$(cd backend/terraform && terraform output -raw api_gateway_url 2>/dev/null)
if [ -n "$API_URL" ]; then
    echo "Testing: $API_URL/patients"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/patients" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
        echo "✅ API endpoint is accessible (got $HTTP_CODE - expected without auth)"
    else
        echo "❌ API endpoint issue (got $HTTP_CODE)"
    fi
else
    echo "❌ Cannot get API URL from Terraform"
fi
echo ""

echo "======================================"
echo "🎯 NEXT STEPS TO FIX BLANK PAGE:"
echo "======================================"
echo ""
echo "1. ✅ Make sure ALL 6 environment variables above are set in Amplify Console"
echo "   (Go to: Amplify Console → Your App → Environment variables)"
echo ""
echo "2. ✅ Push the latest code to trigger a NEW build:"
echo "   git add ."
echo "   git commit -m 'Fix Phone icon import issue'"
echo "   git push"
echo ""
echo "3. ✅ Wait for Amplify build to complete (3-5 minutes)"
echo "   (Watch in: Amplify Console → Your App → Build history)"
echo ""
echo "4. ✅ Clear browser cache completely:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)"
echo "   - Or use Incognito/Private mode"
echo ""
echo "5. ✅ Check browser console (F12) for errors"
echo "   - Should see: '✅ Amplify configured successfully'"
echo "   - Should NOT see: 'Phone is not defined'"
echo ""
echo "======================================"
echo "💡 COMMON ISSUES:"
echo "======================================"
echo ""
echo "❌ Issue: Still blank after setting env vars"
echo "   → Did you trigger a NEW build? Old builds don't have new variables!"
echo ""
echo "❌ Issue: 'Phone is not defined' error"
echo "   → Push the code fix and trigger a new build"
echo ""
echo "❌ Issue: Still seeing old version"
echo "   → Clear browser cache or use Incognito mode"
echo ""
echo "❌ Issue: Build succeeds but page is blank"
echo "   → Check browser console (F12) for the actual error"
echo "   → Share the error message for more help"
echo ""
