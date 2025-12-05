# Task 26: Patient Statistics Widget - Implementation Summary

## Overview
Implemented a patient statistics widget on the clinician dashboard that displays:
- Total Active Patients
- New Patients This Month  
- Patients Needing Follow-up (no visit in 6+ months)

This satisfies **Requirement 18.3**: "WHEN a patient has not visited in over 6 months, THEN the System SHALL flag the patient for follow-up"

## Files Modified

### 1. Backend Lambda Function
**File**: `backend/lambda/dashboard/index.mjs`

**Changes**:
- Enhanced the `handleStats()` function to query the Patients and Appointments tables
- Added calculation for:
  - `totalActivePatients`: Count of all active patients for the clinician
  - `newPatientsThisMonth`: Count of patients created since the start of current month
  - `patientsNeedingFollowup`: Count of patients with no completed appointment in 6+ months

**Logic**:
```javascript
// Query active patients
const patients = await queryPatients(userId, status='active')

// Calculate new patients this month
const startOfMonth = new Date(year, month, 1)
newPatientsThisMonth = patients.filter(p => p.createdAt >= startOfMonth).length

// Calculate patients needing follow-up
const sixMonthsAgo = new Date() - 6 months
const appointments = await queryAppointments(userId)
const patientLastVisit = groupByPatient(appointments, status='completed')
patientsNeedingFollowup = patients.filter(p => 
  !patientLastVisit[p.id] || patientLastVisit[p.id] < sixMonthsAgo
).length
```

### 2. Terraform Configuration
**File**: `backend/terraform/lambda.tf`

**Changes**:
- Added `PATIENTS_TABLE` environment variable to dashboard Lambda
- Added `APPOINTMENTS_TABLE` environment variable to dashboard Lambda

**Before**:
```hcl
environment_variables = {
  REPORTS_TABLE = aws_dynamodb_table.reports.name
  ENVIRONMENT   = var.environment
}
```

**After**:
```hcl
environment_variables = {
  REPORTS_TABLE      = aws_dynamodb_table.reports.name
  PATIENTS_TABLE     = aws_dynamodb_table.patients.name
  APPOINTMENTS_TABLE = aws_dynamodb_table.appointments.name
  ENVIRONMENT        = var.environment
}
```

### 3. Frontend Dashboard
**File**: `src/pages/dashboard/Overview.jsx`

**Changes**:
- Added a new "Patient Statistics" card section below the main stats cards
- Displays three statistics with color-coded boxes:
  - **Total Active Patients** (gray background)
  - **New Patients This Month** (green background)
  - **Patients Needing Follow-up** (orange background with warning color)
- Each statistic shows the count and a descriptive label
- The follow-up statistic includes a caption: "No visit in 6+ months"

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│ Patient Statistics                                      │
├─────────────────┬─────────────────┬─────────────────────┤
│ Total Active    │ New Patients    │ Patients Needing    │
│ Patients        │ This Month      │ Follow-up           │
│                 │                 │                     │
│      25         │       4         │        8            │
│                 │                 │ No visit in 6+ mo   │
└─────────────────┴─────────────────┴─────────────────────┘
```

### 4. Documentation
**Files Created**:
- `backend/lambda/dashboard/DEPLOYMENT_NOTE.md` - Deployment instructions
- `docs/MANUAL_TESTING_GUIDE.md` - Added test section 6.1.1

**Files Updated**:
- `docs/MANUAL_TESTING_GUIDE.md` - Added patient statistics widget to checklist

## IAM Permissions

No changes needed! The existing IAM policy in `backend/terraform/iam.tf` already grants the Lambda execution role read access to:
- `aws_dynamodb_table.patients.arn`
- `aws_dynamodb_table.appointments.arn`

## API Response Format

The `/dashboard/stats` endpoint now returns:

```json
{
  "activePatients": 5,           // Existing: unique patients with transcriptions
  "recentTranscriptions": 12,    // Existing: transcriptions in last 30 days
  "pendingReviews": 3,           // Existing: draft/pending reports
  "totalActivePatients": 25,     // NEW: all active patients
  "newPatientsThisMonth": 4,     // NEW: patients created this month
  "patientsNeedingFollowup": 8   // NEW: no visit in 6+ months
}
```

## Testing

### Manual Testing
1. Log in as a clinician
2. Navigate to Dashboard Overview
3. Verify the "Patient Statistics" section displays below the main stats
4. Verify three statistics are shown with appropriate counts
5. Verify color coding (gray, green, orange)

### Test Data Setup
To properly test:
1. Create at least 5 active patients
2. Create 2 patients in the current month (check `createdAt` timestamp)
3. Create appointments for some patients with dates > 6 months ago
4. Mark some appointments as "completed"
5. Refresh dashboard to see updated statistics

### Expected Behavior
- If no patients exist: all counts show 0
- If no appointments exist: all patients show in "needing follow-up"
- If patient has recent completed appointment: not in "needing follow-up"
- Only active patients are counted (inactive patients excluded)

## Deployment

### Prerequisites
- Terraform installed and configured
- AWS credentials set up
- Backend infrastructure already deployed

### Steps
1. Deploy Terraform changes:
   ```bash
   cd backend/terraform
   terraform plan
   terraform apply
   ```

2. Verify Lambda environment variables:
   ```bash
   aws lambda get-function-configuration \
     --function-name clinicavoice-dashboard-production
   ```

3. Test the endpoint:
   ```bash
   curl -H "Authorization: Bearer $TOKEN" \
     https://your-api-gateway-url/dashboard/stats
   ```

4. Deploy frontend:
   ```bash
   npm run build
   # Deploy to hosting (Amplify, S3, etc.)
   ```

## Requirements Validated

✅ **Requirement 18.3**: "WHEN a patient has not visited in over 6 months, THEN the System SHALL flag the patient for follow-up"

The implementation:
- Queries all active patients for the clinician
- Queries all appointments to find last completed visit per patient
- Calculates which patients have no visit in 6+ months
- Displays the count prominently on the dashboard
- Uses orange/warning color to draw attention

## Future Enhancements

Potential improvements for future iterations:
1. Click on "Patients Needing Follow-up" to see the list of patients
2. Add a "Send Follow-up Reminder" button
3. Show trend indicators (↑↓) for month-over-month changes
4. Add date range filter for statistics
5. Export patient statistics to CSV
6. Add patient retention metrics
7. Show average time between visits

## Notes

- The statistics are calculated in real-time on each dashboard load
- For large patient volumes (1000+), consider caching or pre-aggregation
- The 6-month threshold is hardcoded; could be made configurable
- Only completed appointments count as visits (scheduled/cancelled don't count)
- Inactive patients are excluded from all counts
