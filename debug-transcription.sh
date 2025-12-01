#!/bin/bash

# Debug script to check transcription status
# Usage: ./debug-transcription.sh <fileId>

FILE_ID=$1

if [ -z "$FILE_ID" ]; then
    echo "Usage: ./debug-transcription.sh <fileId>"
    echo "Example: ./debug-transcription.sh e4b62888-4ef8-45b8-81a5-3bce980359b3"
    exit 1
fi

echo "🔍 Debugging transcription for fileId: $FILE_ID"
echo ""

# Get table name from terraform output
cd backend/terraform
TABLE_NAME=$(terraform output -raw reports_table_name 2>/dev/null)

if [ -z "$TABLE_NAME" ]; then
    echo "❌ Could not get table name from terraform"
    echo "   Run: cd backend/terraform && terraform output"
    exit 1
fi

cd ../..

echo "📊 DynamoDB Table: $TABLE_NAME"
echo ""

# Check CloudWatch logs for transcribe Lambda
echo "📝 Recent transcribe Lambda logs:"
aws logs tail "/aws/lambda/clinicavoice-transcribe-prod" --since 10m --format short | grep -i "$FILE_ID" | tail -20
echo ""

# Check CloudWatch logs for transcribe-processor Lambda
echo "📝 Recent transcribe-processor Lambda logs:"
aws logs tail "/aws/lambda/clinicavoice-transcribe-processor-prod" --since 30m --format short | grep -i "$FILE_ID" | tail -20
echo ""

# Check CloudWatch logs for transcribe-completion Lambda
echo "📝 Recent transcribe-completion Lambda logs:"
aws logs tail "/aws/lambda/clinicavoice-transcribe-completion-prod" --since 30m --format short | tail -20
echo ""

# Check S3 for transcript file
echo "📁 Checking S3 for transcript files:"
BUCKET=$(cd backend/terraform && terraform output -raw s3_bucket_name 2>/dev/null)
aws s3 ls "s3://$BUCKET/transcripts/" --recursive | grep "$FILE_ID" || echo "   No transcript files found"
echo ""

# Check DynamoDB for the record
echo "🗄️  Checking DynamoDB for record:"
aws dynamodb scan \
    --table-name "$TABLE_NAME" \
    --filter-expression "contains(id, :fileId) OR contains(fileId, :fileId)" \
    --expression-attribute-values "{\":fileId\":{\"S\":\"$FILE_ID\"}}" \
    --output json | jq '.Items[] | {id: .id.S, userId: .userId.S, status: .status.S, jobName: .jobName.S, type: .type.S}'

echo ""
echo "✅ Debug complete"
