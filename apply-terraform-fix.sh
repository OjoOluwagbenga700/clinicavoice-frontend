#!/bin/bash

echo "🔧 Applying Terraform Fix for Patient Invitations"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/terraform/terraform.tfvars" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Checking Terraform configuration"
echo "--------------------------------------------"
cd backend/terraform

# Show what will change
echo ""
echo "Reviewing changes..."
terraform plan -out=tfplan

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Terraform plan failed. Please check the errors above."
    exit 1
fi

echo ""
echo "📋 Step 2: Apply changes"
echo "--------------------------------------------"
echo ""
read -p "Do you want to apply these changes? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No changes were made."
    rm -f tfplan
    exit 0
fi

# Apply the changes
terraform apply tfplan

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Terraform apply failed. Please check the errors above."
    rm -f tfplan
    exit 1
fi

rm -f tfplan

echo ""
echo "✅ Terraform changes applied successfully!"
echo ""

# Verify the Lambda environment variable
echo "📋 Step 3: Verifying Lambda configuration"
echo "--------------------------------------------"
FRONTEND_URL=$(aws lambda get-function-configuration \
  --function-name clinicavoice-patient-invitation-prod \
  --query 'Environment.Variables.FRONTEND_URL' \
  --output text 2>/dev/null)

if [ -n "$FRONTEND_URL" ]; then
    echo "✅ FRONTEND_URL is set to: $FRONTEND_URL"
else
    echo "⚠️  Could not verify FRONTEND_URL (AWS CLI might not be configured)"
fi

cd ../..

echo ""
echo "======================================"
echo "🎉 Fix Applied Successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Go to your app → Patients page"
echo "2. Click the resend invitation button (envelope icon)"
echo "3. Patient will receive invitation email"
echo "4. Patient clicks activation link in email"
echo "5. Patient sets password and activates account"
echo ""
echo "Note: Patient may need to confirm SNS subscription first"
echo "(Check spam folder for 'AWS Notification - Subscription Confirmation')"
echo ""
