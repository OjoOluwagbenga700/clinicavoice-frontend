# Appointment Analytics Lambda - Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform installed (v1.0+)
- Node.js 20.x installed
- Access to the ClinicaVoice AWS account

## Deployment Steps

### 1. Install Dependencies

```bash
cd backend/lambda/appointment-analytics
npm install
```

### 2. Run Tests

Verify the Lambda function works correctly:

```bash
npm test
```

All tests should pass before deployment.

### 3. Deploy Infrastructure

The Lambda function is deployed via Terraform:

```bash
cd backend/terraform

# Review changes
terraform plan

# Apply changes
terraform apply
```

This will:
- Package the Lambda function code
- Create the `appointment-analytics` Lambda function
- Add the `/appointments/analytics` API Gateway endpoint
- Configure IAM permissions for DynamoDB access

### 4. Verify Deployment

After deployment, verify the Lambda function is working:

```bash
# Get the API Gateway URL from Terraform outputs
terraform output api_gateway_url

# Test the endpoint (replace with actual URL and token)
curl -H "Authorization: Bearer <cognito-token>" \
  "https://api.clinicavoice.ca/appointments/analytics?startDate=2025-01-01&endDate=2025-12-31"
```

Expected response:
```json
{
  "statusCounts": { ... },
  "noShowRate": 0,
  "cancellationRate": 0,
  "averageDurationByType": { ... },
  "patientVolumeTrends": { ... },
  "summary": { ... }
}
```

### 5. Deploy Frontend

The frontend changes are deployed automatically via Amplify:

```bash
cd ../..  # Back to project root
npm run build

# Commit and push to trigger Amplify deployment
git add .
git commit -m "Add appointment analytics dashboard"
git push
```

## Environment Variables

The Lambda function requires these environment variables (configured in Terraform):

- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments
- `ENVIRONMENT`: Deployment environment (dev/staging/prod)

## IAM Permissions

The Lambda function needs these permissions:

- `dynamodb:Query` on Appointments table
- `dynamodb:GetItem` on Appointments table
- CloudWatch Logs permissions (automatically granted)

These are configured in `backend/terraform/iam.tf`.

## Monitoring

### CloudWatch Logs

View Lambda execution logs:

```bash
aws logs tail /aws/lambda/clinicavoice-appointment-analytics-prod --follow
```

### CloudWatch Metrics

Monitor these metrics:
- Invocations
- Duration
- Errors
- Throttles

### Alarms

Consider setting up CloudWatch alarms for:
- Error rate > 5%
- Duration > 10 seconds
- Throttles > 0

## Troubleshooting

### Lambda Timeout

If queries are timing out:
1. Check the date range - large ranges may take longer
2. Increase Lambda timeout in `backend/terraform/lambda.tf`
3. Consider adding pagination for large datasets

### DynamoDB Throttling

If seeing throttling errors:
1. Check DynamoDB table capacity
2. Enable auto-scaling on the Appointments table
3. Consider using DynamoDB on-demand pricing

### Authorization Errors

If getting 403 Forbidden:
1. Verify the user has a valid Cognito token
2. Check the user's `custom:user_type` attribute is "clinician"
3. Verify API Gateway authorizer configuration

## Rollback

To rollback the deployment:

```bash
cd backend/terraform

# Revert to previous state
terraform apply -target=aws_lambda_function.functions["appointment-analytics"] \
  -var="lambda_version=previous"
```

Or manually:
1. Delete the Lambda function in AWS Console
2. Remove the API Gateway route
3. Run `terraform apply` to restore previous state

## Performance Optimization

For better performance:

1. **Add Caching**: Enable API Gateway caching for frequently accessed date ranges
2. **Optimize Queries**: Use DynamoDB indexes efficiently
3. **Batch Processing**: For very large datasets, consider batch processing
4. **CDN**: Use CloudFront to cache analytics responses

## Security Considerations

- Only clinicians can access analytics (enforced in Lambda)
- All data is encrypted in transit (HTTPS)
- DynamoDB data is encrypted at rest
- No PII is exposed in logs
- Rate limiting is enabled on API Gateway

## Cost Estimation

Estimated monthly costs (assuming 1000 clinicians, 10 analytics views per day):

- Lambda invocations: ~300,000/month = $0.06
- Lambda duration: ~300,000 * 1s = $5.00
- DynamoDB reads: ~300,000 * 10 items = $0.38
- API Gateway: ~300,000 requests = $1.05

**Total: ~$6.50/month**

## Support

For issues or questions:
- Check CloudWatch Logs for error details
- Review the Lambda function code in `index.mjs`
- Contact the DevOps team for infrastructure issues
