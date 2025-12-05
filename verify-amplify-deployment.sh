#!/bin/bash

# Verify Amplify Deployment Script
# This script helps diagnose issues with the Amplify deployment

echo "🔍 Verifying Amplify Deployment..."
echo ""

# Check if Terraform outputs are available
echo "📊 Checking Terraform outputs..."
cd backend/terraform

echo ""
echo "API Gateway URL:"
terraform output -raw api_gateway_url 2>/dev/null || echo "❌ Not found"

echo ""
echo "Cognito User Pool ID:"
terraform output -raw cognito_user_pool_id 2>/dev/null || echo "❌ Not found"

echo ""
echo "Cognito Client ID:"
terraform output -raw cognito_user_pool_client_id 2>/dev/null || echo "❌ Not found"

echo ""
echo "Cognito Identity Pool ID:"
terraform output -raw cognito_identity_pool_id 2>/dev/null || echo "❌ Not found"

echo ""
echo "S3 Bucket:"
terraform output -raw s3_bucket_name 2>/dev/null || echo "❌ Not found"

echo ""
echo "SNS Topic ARN:"
terraform output -raw sns_topic_arn 2>/dev/null || echo "❌ Not found"

cd ../..

echo ""
echo "📝 Required Amplify Environment Variables:"
echo "-------------------------------------------"
echo "VITE_API_ENDPOINT=$(cd backend/terraform && terraform output -raw api_gateway_url 2>/dev/null)"
echo "VITE_AWS_USER_POOL_ID=$(cd backend/terraform && terraform output -raw cognito_user_pool_id 2>/dev/null)"
echo "VITE_AWS_USER_POOL_CLIENT_ID=$(cd backend/terraform && terraform output -raw cognito_user_pool_client_id 2>/dev/null)"
echo "VITE_AWS_IDENTITY_POOL_ID=$(cd backend/terraform && terraform output -raw cognito_identity_pool_id 2>/dev/null)"
echo "VITE_S3_BUCKET=$(cd backend/terraform && terraform output -raw s3_bucket_name 2>/dev/null)"
echo "VITE_AWS_REGION=us-east-1"

echo ""
echo "✅ Copy these values to your Amplify Console > Environment variables"
echo ""

# Test API Gateway endpoint
echo "🧪 Testing API Gateway endpoint..."
API_URL=$(cd backend/terraform && terraform output -raw api_gateway_url 2>/dev/null)

if [ -n "$API_URL" ]; then
  echo "Testing: $API_URL/patients"
  echo ""
  
  # Note: This will fail without auth token, but we can see if endpoint exists
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/patients" 2>/dev/null || echo "000")
  
  if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Endpoint exists (401 Unauthorized - expected without auth token)"
  elif [ "$HTTP_CODE" = "403" ]; then
    echo "✅ Endpoint exists (403 Forbidden - expected without auth token)"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Endpoint not found (404) - API Gateway may not be deployed correctly"
  elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Cannot reach endpoint - check URL"
  else
    echo "⚠️  Unexpected response: $HTTP_CODE"
  fi
else
  echo "❌ API Gateway URL not found in Terraform outputs"
fi

echo ""
echo "🔍 Next Steps:"
echo "1. Add the environment variables above to Amplify Console"
echo "2. Trigger a new build in Amplify"
echo "3. Wait for build to complete"
echo "4. Clear browser cache and test again"
