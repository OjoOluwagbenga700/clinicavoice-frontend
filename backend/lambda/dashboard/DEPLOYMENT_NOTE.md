# Dashboard Lambda - Patient Statistics Update

## Changes Made

### Lambda Function Updates
- Added patient statistics calculation to `/dashboard/stats` endpoint
- Now returns additional fields:
  - `totalActivePatients`: Count of all active patients
  - `newPatientsThisMonth`: Count of patients created in current month
  - `patientsNeedingFollowup`: Count of patients with no visit in 6+ months

### Environment Variables Required
The dashboard Lambda now requires access to:
- `PATIENTS_TABLE` - To query active patients
- `APPOINTMENTS_TABLE` - To check last visit dates

These have been added to `backend/terraform/lambda.tf`

### IAM Permissions
The Lambda already has read access to Patients and Appointments tables via the existing DynamoDB policy in `backend/terraform/iam.tf`

## Deployment Steps

1. **Update Terraform Configuration**
   ```bash
   cd backend/terraform
   terraform plan
   terraform apply
   ```
   This will update the dashboard Lambda with the new environment variables.

2. **Deploy Lambda Code**
   The Lambda code has been updated in `backend/lambda/dashboard/index.mjs`
   Terraform will automatically deploy the updated code.

3. **Verify Deployment**
   - Check CloudWatch logs for the dashboard Lambda
   - Test the `/dashboard/stats` endpoint
   - Verify the new fields are returned

## Testing

### Manual Test
1. Log in as a clinician
2. Navigate to the Dashboard Overview page
3. Verify the "Patient Statistics" section displays:
   - Total Active Patients
   - New Patients This Month
   - Patients Needing Follow-up

### API Test
```bash
# Get auth token from Cognito
# Then call the stats endpoint
curl -H "Authorization: Bearer $TOKEN" \
  https://your-api-gateway-url/dashboard/stats
```

Expected response:
```json
{
  "activePatients": 5,
  "recentTranscriptions": 12,
  "pendingReviews": 3,
  "totalActivePatients": 25,
  "newPatientsThisMonth": 4,
  "patientsNeedingFollowup": 8
}
```

## Rollback Plan

If issues occur:
1. Revert the Lambda code changes in `backend/lambda/dashboard/index.mjs`
2. Run `terraform apply` to deploy the previous version
3. The frontend will gracefully handle missing fields (displays 0)

## Requirements Validated

- ✅ Requirement 18.3: "WHEN a patient has not visited in over 6 months, THEN the System SHALL flag the patient for follow-up"
- ✅ Total active patients count
- ✅ New patients this month count
- ✅ Patients needing follow-up (6+ months without visit)
