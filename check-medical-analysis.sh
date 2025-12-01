#!/bin/bash

# Check if comprehend-medical Lambda is running and updating records
# Usage: ./check-medical-analysis.sh <reportId>

REPORT_ID=$1

if [ -z "$REPORT_ID" ]; then
    echo "Usage: ./check-medical-analysis.sh <reportId>"
    echo "Example: ./check-medical-analysis.sh 767b8d27-0d2f-4c5e-9c4c-9f9fc4dca5a1"
    exit 1
fi

echo "🔍 Checking medical analysis for report: $REPORT_ID"
echo ""

# Check comprehend-medical Lambda logs
echo "📝 Recent comprehend-medical Lambda logs:"
aws logs tail /aws/lambda/clinicavoice-comprehend-medical-prod --since 30m --format short | tail -30
echo ""

# Check transcribe-completion Lambda logs (should show invocation)
echo "📝 Recent transcribe-completion Lambda logs:"
aws logs tail /aws/lambda/clinicavoice-transcribe-completion-prod --since 30m --format short | grep -i "comprehend\|medical" | tail -10
echo ""

# Check DynamoDB for the report
echo "🗄️  Checking DynamoDB for medical analysis field:"
TABLE_NAME=$(cd backend/terraform && terraform output -raw reports_table_name 2>/dev/null)

if [ -z "$TABLE_NAME" ]; then
    echo "❌ Could not get table name from terraform"
    exit 1
fi

echo "Table: $TABLE_NAME"
echo ""

# Query the report (need userId - will scan for it)
aws dynamodb scan \
    --table-name "$TABLE_NAME" \
    --filter-expression "id = :reportId" \
    --expression-attribute-values "{\":reportId\":{\"S\":\"$REPORT_ID\"}}" \
    --output json | jq '.Items[0] | {
        id: .id.S,
        userId: .userId.S,
        status: .status.S,
        hasMedicalAnalysis: (.medicalAnalysis != null),
        medicalAnalysisSummary: .medicalAnalysis.M.summary.M
    }'

echo ""
echo "✅ Check complete"
echo ""
echo "💡 If hasMedicalAnalysis is false:"
echo "   1. Check Lambda logs above for errors"
echo "   2. Ensure Lambda was deployed: cd backend/terraform && terraform apply"
echo "   3. Wait 1-2 minutes and run this script again"
