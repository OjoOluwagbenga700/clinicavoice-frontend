#!/bin/bash

echo "🔍 Checking Lambda function deployments..."
echo ""

# Check each Lambda function's last modified time
for func in transcribe transcribe-processor transcribe-completion upload; do
    echo "📦 $func:"
    aws lambda get-function --function-name "clinicavoice-$func-prod" \
        --query 'Configuration.[LastModified,CodeSize,Runtime]' \
        --output text 2>/dev/null || echo "   ❌ Function not found"
    echo ""
done

echo "💡 If LastModified is old, run: cd backend/terraform && terraform apply"
