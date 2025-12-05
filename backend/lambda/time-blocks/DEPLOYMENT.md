# Time Blocks Lambda - Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform installed (v1.0+)
- Node.js 20.x installed
- Access to the ClinicaVoice AWS account

## Pre-Deployment Checklist

1. ✅ Lambda function implemented (`index.mjs`)
2. ✅ Tests passing (`npm test`)
3. ✅ Terraform configuration updated
4. ✅ API Gateway routes configured
5. ✅ IAM permissions verified
6. ✅ DynamoDB table exists (timeblocks)

## Deployment Steps

### 1. Install Dependencies

```bash
cd backend/lambda/time-blocks
npm install
```

### 2. Run Tests

```bash
npm test
```

Ensure all tests pass before deploying.

### 3. Validate Terraform Configuration

```bash
cd ../../terraform
terraform validate
```

### 4. Review Terraform Plan

```bash
terraform plan
```

Review the changes that will be made:
- New Lambda function: `clinicavoice-time-blocks-{environment}`
- New API Gateway resources: `/time-blocks` and `/time-blocks/{id}`
- New API Gateway methods: GET, POST, PUT, DELETE
- Lambda permissions for API Gateway

### 5. Apply Terraform Changes

```bash
terraform apply
```

Type `yes` when prompted to confirm the changes.

### 6. Verify Deployment

After deployment, verify the Lambda function:

```bash
aws lambda get-function --function-name clinicavoice-time-blocks-dev
```

Verify the API Gateway endpoints:

```bash
aws apigateway get-resources --rest-api-id <api-id>
```

### 7. Test the API

Get the API Gateway URL from Terraform outputs:

```bash
terraform output api_gateway_url
```

Test the endpoints:

```bash
# List time blocks (requires authentication)
curl -X GET \
  https://<api-gateway-url>/dev/time-blocks \
  -H "Authorization: Bearer <cognito-token>"

# Create a time block
curl -X POST \
  https://<api-gateway-url>/dev/time-blocks \
  -H "Authorization: Bearer <cognito-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-10",
    "startTime": "12:00",
    "endTime": "13:00",
    "reason": "Lunch break",
    "type": "break"
  }'
```

## Rollback Procedure

If issues are encountered after deployment:

1. Revert Terraform changes:
   ```bash
   terraform apply -target=aws_lambda_function.functions["time-blocks"] -destroy
   ```

2. Or restore from the previous Terraform state:
   ```bash
   terraform state pull > current.tfstate
   cp terraform.tfstate.backup terraform.tfstate
   terraform apply
   ```

## Monitoring

After deployment, monitor the Lambda function:

### CloudWatch Logs

```bash
aws logs tail /aws/lambda/clinicavoice-time-blocks-dev --follow
```

### Lambda Metrics

Check the Lambda console for:
- Invocation count
- Error rate
- Duration
- Throttles

### API Gateway Metrics

Check the API Gateway console for:
- Request count
- 4XX errors
- 5XX errors
- Latency

## Troubleshooting

### Lambda Function Not Found

If the Lambda function is not found after deployment:
1. Check Terraform outputs: `terraform output lambda_function_names`
2. Verify the function exists: `aws lambda list-functions | grep time-blocks`
3. Check CloudWatch logs for deployment errors

### API Gateway 403 Forbidden

If API calls return 403:
1. Verify Cognito token is valid
2. Check user has `custom:user_type` = `clinician`
3. Verify API Gateway authorizer is configured correctly

### API Gateway 500 Internal Server Error

If API calls return 500:
1. Check CloudWatch logs for Lambda errors
2. Verify environment variables are set correctly
3. Check DynamoDB table permissions

### Time Block Conflicts Not Detected

If time blocks are created despite appointment conflicts:
1. Verify APPOINTMENTS_TABLE environment variable is set
2. Check Lambda has permissions to query appointments table
3. Review CloudWatch logs for query errors

## Post-Deployment Verification

Run these checks after deployment:

1. **Authorization Test**: Verify non-clinicians are rejected
   ```bash
   # Should return 403
   curl -X GET https://<api-gateway-url>/dev/time-blocks \
     -H "Authorization: Bearer <patient-token>"
   ```

2. **Validation Test**: Verify invalid data is rejected
   ```bash
   # Should return 400
   curl -X POST https://<api-gateway-url>/dev/time-blocks \
     -H "Authorization: Bearer <clinician-token>" \
     -H "Content-Type: application/json" \
     -d '{"date": "invalid"}'
   ```

3. **CRUD Test**: Create, read, update, delete a time block
   ```bash
   # Create
   ID=$(curl -X POST ... | jq -r '.id')
   
   # Read
   curl -X GET https://<api-gateway-url>/dev/time-blocks/$ID
   
   # Update
   curl -X PUT https://<api-gateway-url>/dev/time-blocks/$ID \
     -d '{"reason": "Updated reason"}'
   
   # Delete
   curl -X DELETE https://<api-gateway-url>/dev/time-blocks/$ID
   ```

4. **Conflict Test**: Verify conflict detection works
   - Create an appointment
   - Try to create a time block that overlaps
   - Should return 409 Conflict

## Environment Variables

Ensure these environment variables are set in the Lambda configuration:

- `TIMEBLOCKS_TABLE`: DynamoDB table name for time blocks
- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments
- `ENVIRONMENT`: Deployment environment (dev, staging, prod)

## Security Considerations

- Lambda function uses IAM role with least privilege
- API Gateway uses Cognito authorizer
- DynamoDB tables have encryption at rest enabled
- CloudWatch logs have 14-day retention

## Next Steps

After successful deployment:

1. Update frontend to integrate with time-blocks API
2. Add time blocks to calendar view
3. Test end-to-end workflow with appointments
4. Monitor usage and performance
5. Consider implementing optional property-based tests (task 11.2)

## Support

For issues or questions:
- Check CloudWatch logs first
- Review the README.md for API documentation
- Consult the IMPLEMENTATION_SUMMARY.md for details
