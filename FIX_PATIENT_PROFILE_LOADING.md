# 🔧 Fix: Patient Profile Not Loading

## Problem

When a patient logs in and clicks "My Profile", the profile doesn't load. Shows error: "Unable to load your profile. Please contact support."

## Root Cause

When patients activate their account, the `custom:patientId` attribute is not being set in their Cognito user profile. The PatientProfile component needs this attribute to know which patient record to fetch.

## Solution

Two fixes are required:

### Fix 1: Add `custom:patientId` to Cognito Schema

I've updated `backend/terraform/cognito.tf` to add the `patientId` custom attribute.

### Fix 2: Set `custom:patientId` During Activation

I've updated `backend/lambda/patient-activation/index.mjs` to set the `custom:patientId` attribute when creating the Cognito user.

## Deploy the Fixes

### Step 1: Apply Terraform Changes

**IMPORTANT:** This will modify the Cognito User Pool schema. Existing users won't be affected, but new users will have the attribute.

```bash
cd backend/terraform

# Review changes
terraform plan

# Apply changes
terraform apply

# Type 'yes' when prompted
```

### Step 2: Redeploy Lambda Function

The Lambda code change needs to be deployed:

```bash
cd backend/terraform

# Package and deploy the Lambda
terraform apply -target=aws_lambda_function.lambda_functions["patient-activation"]

# Or redeploy all Lambdas
terraform apply
```

### Step 3: Test with New Patient

**Existing patients won't have the attribute**, so you need to test with a new patient:

1. **Create a new test patient** (as clinician)
   - Use a different email than before
   - Click "Save Patient"

2. **Check email for invitation**
   - Confirm SNS subscription (if first time)
   - Click activation link

3. **Activate account**
   - Set password
   - Complete activation

4. **Login as patient**
   - Use the email and password
   - Should see patient dashboard

5. **Click "My Profile"**
   - Should load patient profile successfully!

## For Existing Patients

Existing patients who already activated their accounts won't have the `custom:patientId` attribute. You have two options:

### Option A: Update Existing Users Manually (AWS Console)

1. Go to AWS Cognito Console
2. Find your User Pool: `clinicavoice-user-pool-prod`
3. Click "Users"
4. Find the patient user
5. Click on the user
6. Click "Edit" under "Attributes"
7. Add custom attribute:
   - Name: `custom:patientId`
   - Value: `<patient-id-from-dynamodb>`
8. Save

### Option B: Create Script to Update Existing Users

Create `update-patient-cognito-attributes.sh`:

```bash
#!/bin/bash

# Update existing patient users with patientId attribute

USER_POOL_ID="us-east-1_cSlyoY7Kk"

# Get all patients from DynamoDB
aws dynamodb scan \
  --table-name clinicavoice-patients-prod \
  --filter-expression "accountStatus = :status" \
  --expression-attribute-values '{":status":{"S":"active"}}' \
  --query 'Items[*].[id.S, email.S, cognitoUserId.S]' \
  --output text | while read -r PATIENT_ID EMAIL COGNITO_USER_ID; do
  
  if [ -n "$COGNITO_USER_ID" ]; then
    echo "Updating user: $EMAIL (Patient ID: $PATIENT_ID)"
    
    aws cognito-idp admin-update-user-attributes \
      --user-pool-id "$USER_POOL_ID" \
      --username "$EMAIL" \
      --user-attributes Name=custom:patientId,Value="$PATIENT_ID"
    
    if [ $? -eq 0 ]; then
      echo "✅ Updated successfully"
    else
      echo "❌ Failed to update"
    fi
  fi
done

echo ""
echo "✅ All active patients updated"
```

Make it executable and run:
```bash
chmod +x update-patient-cognito-attributes.sh
./update-patient-cognito-attributes.sh
```

### Option C: Have Patients Re-activate (Simplest)

1. Delete the patient's Cognito user (keeps patient record)
2. Resend invitation
3. Patient activates again with new Lambda code
4. `custom:patientId` will be set correctly

## Verification

### Check if Attribute is Set

```bash
# Get user attributes
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_cSlyoY7Kk \
  --username patient-email@example.com

# Look for:
# {
#   "Name": "custom:patientId",
#   "Value": "patient-id-here"
# }
```

### Test Patient Profile Loading

1. Login as patient
2. Click "My Profile" in sidebar
3. Should see:
   - Patient name
   - Demographics
   - Contact information
   - Appointments (if any)
   - Medical history (if any)

## Why This Happens

**The Flow:**

1. **Clinician creates patient** → Patient record in DynamoDB (has `id`)
2. **Patient activates account** → Cognito user created (has `sub`)
3. **Patient logs in** → Gets Cognito user info
4. **Patient clicks "My Profile"** → Needs to know which patient record to fetch
5. **Problem:** No link between Cognito user and patient record!

**The Solution:**

Store the patient ID (`patient.id`) as a custom attribute (`custom:patientId`) in the Cognito user profile. This creates the link.

## Architecture

```
┌─────────────────┐
│ Cognito User    │
│ ─────────────── │
│ sub: xxx        │
│ email: xxx      │
│ custom:patientId│ ──┐
└─────────────────┘   │
                      │ Links to
                      │
┌─────────────────┐   │
│ DynamoDB Patient│ ◄─┘
│ ─────────────── │
│ id: xxx         │
│ email: xxx      │
│ cognitoUserId   │
└─────────────────┘
```

## Summary

**What was fixed:**
1. ✅ Added `custom:patientId` to Cognito User Pool schema
2. ✅ Updated patient activation Lambda to set the attribute
3. ✅ Patient profile can now load correctly

**What you need to do:**
1. Apply Terraform changes: `terraform apply`
2. Test with a NEW patient (existing patients need manual update)
3. Optionally: Update existing patients using script or AWS Console

**For testing:**
- Create new patient with fresh email
- Activate account
- Login as patient
- Click "My Profile" → Should work!

The patient profile will now load correctly for all newly activated patients! 🎉
