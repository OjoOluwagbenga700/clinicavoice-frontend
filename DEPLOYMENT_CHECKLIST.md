# Transcription Fix Deployment Checklist

## Pre-Deployment Checks

- [ ] All code changes committed
- [ ] Terraform state is clean (`terraform plan` shows expected changes)

## Deployment Steps

### 1. Deploy Infrastructure
```bash
cd backend/terraform
terraform init
terraform plan  # Review changes
terraform apply # Type 'yes' to confirm
```

Expected changes:
- Update 4 Lambda functions (transcribe, transcribe-processor, upload, transcribe-completion)
- Create transcribe-completion Lambda
- Update S3 bucket notifications
- Update IAM policies
- Update API Gateway

### 2. Verify Lambda Deployments
```bash
# Check if functions were updated
aws lambda list-functions --query 'Functions[?contains(FunctionName, `clinicavoice`) && contains(FunctionName, `prod`)].{Name:FunctionName, Modified:LastModified}' --output table
```

### 3. Verify S3 Event Notifications
```bash
# Get bucket name
BUCKET=$(cd backend/terraform && terraform output -raw s3_bucket_name)

# Check S3 notifications
aws s3api get-bucket-notification-configuration --bucket $BUCKET
```

Should show 3 Lambda function configurations:
- transcribe-processor (audio/*)
- transcribe-completion (transcripts/*.json)
- comprehend-medical (transcripts/*.json)

### 4. Test the Workflow

1. **Upload a file**:
   - Go to Transcribe page
   - Upload a short audio file (< 1 minute)
   - Note the fileId from browser console

2. **Check CloudWatch Logs**:
```bash
# Replace FILE_ID with actual ID
FILE_ID="your-file-id-here"

# Check upload Lambda
aws logs tail /aws/lambda/clinicavoice-upload-prod --since 5m --follow

# Check transcribe-processor Lambda
aws logs tail /aws/lambda/clinicavoice-transcribe-processor-prod --since 5m --follow

# Check transcribe-completion Lambda (wait 1-2 minutes)
aws logs tail /aws/lambda/clinicavoice-transcribe-completion-prod --since 5m --follow

# Check transcribe status Lambda
aws logs tail /aws/lambda/clinicavoice-transcribe-prod --since 5m --follow
```

3. **Check DynamoDB**:
```bash
TABLE_NAME=$(cd backend/terraform && terraform output -raw reports_table_name)

# Query for your record
aws dynamodb get-item \
    --table-name $TABLE_NAME \
    --key "{\"id\":{\"S\":\"$FILE_ID\"},\"userId\":{\"S\":\"YOUR_USER_ID\"}}"
```

4. **Check S3**:
```bash
# Check if transcript was created
aws s3 ls s3://$BUCKET/transcripts/ --recursive | grep transcription
```

## Troubleshooting

### Issue: Lambda not updating
**Solution**: Redeploy Lambda
```bash
cd backend/terraform
terraform taint 'aws_lambda_function.functions["transcribe-completion"]'
terraform apply
```

### Issue: S3 event not triggering
**Solution**: Check Lambda permissions
```bash
aws lambda get-policy --function-name clinicavoice-transcribe-completion-prod
```

Should show S3 as allowed principal.

### Issue: DynamoDB record not found
**Possible causes**:
1. userId mismatch - Check CloudWatch logs for actual userId
2. Record not created - Check upload Lambda logs
3. Wrong table - Verify REPORTS_TABLE environment variable

### Issue: Transcription timeout
**Check**:
1. Is AWS Transcribe job actually running?
```bash
aws transcribe list-transcription-jobs --status IN_PROGRESS
```

2. Did the job complete?
```bash
aws transcribe list-transcription-jobs --status COMPLETED | grep transcription
```

3. Was the completion Lambda triggered?
```bash
aws logs filter-log-events \
    --log-group-name /aws/lambda/clinicavoice-transcribe-completion-prod \
    --start-time $(date -u -d '10 minutes ago' +%s)000
```

## Success Criteria

- ✅ File uploads successfully
- ✅ transcribe-processor Lambda runs and starts AWS Transcribe job
- ✅ AWS Transcribe job completes (check AWS Console)
- ✅ transcribe-completion Lambda runs when JSON is saved to S3
- ✅ DynamoDB record updated to "completed" status
- ✅ Frontend polls and receives transcript
- ✅ Transcript displays in UI

## Quick Debug Command

```bash
./debug-transcription.sh <fileId>
```

This will check:
- CloudWatch logs for all relevant Lambdas
- S3 for transcript files
- DynamoDB for the record
