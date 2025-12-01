#!/bin/bash

# Manually trigger medical analysis for an existing report
# Usage: ./trigger-medical-analysis.sh <reportId> <userId>

REPORT_ID=$1
USER_ID=$2

if [ -z "$REPORT_ID" ] || [ -z "$USER_ID" ]; then
    echo "Usage: ./trigger-medical-analysis.sh <reportId> <userId>"
    echo ""
    echo "To get userId, run:"
    echo "  aws dynamodb scan --table-name <table-name> --filter-expression \"id = :id\" --expression-attribute-values '{\": id\":{\"S\":\"$REPORT_ID\"}}' | jq '.Items[0].userId.S'"
    exit 1
fi

echo "🏥 Manually triggering medical analysis..."
echo "   Report ID: $REPORT_ID"
echo "   User ID: $USER_ID"
echo ""

# Get the report from DynamoDB
TABLE_NAME=$(cd backend/terraform && terraform output -raw reports_table_name 2>/dev/null)

echo "📊 Fetching report from DynamoDB..."
REPORT=$(aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --key "{\"id\":{\"S\":\"$REPORT_ID\"},\"userId\":{\"S\":\"$USER_ID\"}}" \
    --output json)

TRANSCRIPT=$(echo "$REPORT" | jq -r '.Item.content.S // .Item.transcript.S // empty')

if [ -z "$TRANSCRIPT" ]; then
    echo "❌ No transcript found in report"
    exit 1
fi

echo "✅ Found transcript (${#TRANSCRIPT} characters)"
echo ""

# Invoke comprehend-medical Lambda directly
echo "🚀 Invoking comprehend-medical Lambda..."

aws lambda invoke \
    --function-name clinicavoice-comprehend-medical-prod \
    --invocation-type Event \
    --payload "{\"transcriptionId\":\"$REPORT_ID\",\"userId\":\"$USER_ID\",\"transcript\":\"$TRANSCRIPT\"}" \
    /dev/null

echo ""
echo "✅ Lambda invoked successfully"
echo ""
echo "⏳ Wait 30-60 seconds, then check the report again"
echo "   Or run: ./check-medical-analysis.sh $REPORT_ID"
