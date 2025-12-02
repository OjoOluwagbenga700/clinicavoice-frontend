# Transcription Workflow Fix Summary

## Problem
The transcription workflow was failing with timeout errors. Files were uploaded to S3 and transcription jobs were completing, but the frontend couldn't retrieve the results.

## Root Causes Identified

1. **Missing Authorization Headers**: Frontend wasn't sending auth tokens to check transcription status
2. **Missing API Route**: POST `/transcribe/{id}` endpoint didn't exist in API Gateway
3. **Wrong Event Structure**: Lambda was using `event.requestContext.http.method` instead of `event.httpMethod`
4. **Inefficient DynamoDB Query**: Using FilterExpression instead of direct key lookup
5. **Missing Completion Handler**: No Lambda to update DynamoDB when AWS Transcribe job completes

## Changes Made

### 1. Frontend Changes (`src/services/uploadService.js`)
- Added Authorization header to `checkTranscriptionStatus()` function
- Now properly authenticates when polling for transcription status

### 2. API Gateway Changes (`backend/terraform/api-gateway.tf`)
- Added POST `/transcribe/{id}` endpoint
- Mapped route to transcribe Lambda function

### 3. IAM Changes (`backend/terraform/iam.tf`)
- Added `authenticated_user_api` policy
- Grants `execute-api:Invoke` permission to authenticated Cognito users

### 4. Transcribe Lambda (`backend/lambda/transcribe/index.mjs`)
- Fixed event structure: `event.httpMethod` instead of `event.requestContext.http.method`
- Added POST `/transcribe/{id}` handler
- Changed from FilterExpression query to direct GetCommand using primary key
- More efficient DynamoDB lookups

### 5. Transcribe Processor Lambda (`backend/lambda/transcribe-processor/index.mjs`)
- Fixed S3 key parsing to extract userId and fileId correctly
- Properly updates existing DynamoDB record created by upload Lambda
- Added fileId field to DynamoDB record
- Better error handling and logging

### 6. New Transcribe Completion Lambda (`backend/lambda/transcribe-completion/index.mjs`)
- **NEW FILE**: Handles AWS Transcribe job completion events
- Retrieves transcript from S3
- Updates DynamoDB record with completed status and transcript text
- Handles both COMPLETED and FAILED job statuses

### 7. S3 Event Configuration (`backend/terraform/s3.tf`)
- Added S3 event notification for transcribe-completion Lambda
- Triggers when transcript JSON files are created in `transcripts/` folder
- Simpler and more direct than EventBridge

### 8. Lambda Configuration (`backend/terraform/lambda.tf`)
- Added transcribe-completion function to locals
- Configured with proper environment variables and permissions

## Workflow After Fix

1. **Upload**: User uploads file → Upload Lambda creates DynamoDB record with `id: fileId`
2. **S3 Trigger**: File lands in S3 → S3 event triggers transcribe-processor Lambda
3. **Start Transcription**: Transcribe-processor updates record to "processing" and starts AWS Transcribe job
4. **Polling**: Frontend polls POST `/transcribe/{fileId}` → Gets status from DynamoDB
5. **Transcribe Completes**: AWS Transcribe saves JSON to S3 `transcripts/` folder
6. **S3 Trigger**: S3 event triggers transcribe-completion Lambda
7. **Update**: Transcribe-completion retrieves transcript from S3 and updates DynamoDB to "completed"
8. **Medical Analysis**: Transcribe-completion invokes comprehend-medical Lambda asynchronously
9. **Display**: Frontend's next poll gets "completed" status with transcript text

## Deployment Instructions

```bash
cd backend/terraform
terraform init
terraform plan
terraform apply
```

This will:
- Create the new transcribe-completion Lambda function
- Create the EventBridge rule and target
- Update all existing Lambda functions with fixes
- Update API Gateway with new POST endpoint
- Update IAM policies

## Testing

1. Log in as a clinician
2. Navigate to Transcribe page
3. Upload an audio file
4. Wait for transcription (should complete within 1-2 minutes for short files)
5. Transcript should appear automatically when complete

## Files Modified

- `src/services/uploadService.js`
- `backend/terraform/api-gateway.tf`
- `backend/terraform/iam.tf`
- `backend/terraform/lambda.tf`
- `backend/lambda/transcribe/index.mjs`
- `backend/lambda/transcribe-processor/index.mjs`

## Files Created

- `backend/lambda/transcribe-completion/index.mjs`

## Architecture Benefits

**Why S3 Events Instead of EventBridge:**
- ✅ Simpler configuration - no additional AWS service needed
- ✅ Direct trigger - S3 → Lambda with no intermediary
- ✅ Lower latency - immediate trigger when file is created
- ✅ Lower cost - no EventBridge charges
- ✅ Consistent pattern - same approach used for audio uploads

**Comprehend Medical Invocation:**
- Invoked by transcribe-completion Lambda after DynamoDB update
- Sequential processing ensures transcript is saved before medical analysis
- Async invocation (Event type) for non-blocking execution
- Failure in medical analysis doesn't affect transcription completion

**Why Sequential Instead of Parallel S3 Events:**
- S3 doesn't allow overlapping event notifications (same prefix/suffix)
- Sequential ensures proper ordering: transcript → DynamoDB → medical analysis
- Simpler error handling and debugging
