# 📧 Patient Invitation & Activation Guide

## Overview

The patient invitation system works like this:
1. Clinician creates a patient in the system
2. Patient status shows "Pending" (waiting for activation)
3. System sends invitation email via SNS
4. Patient clicks activation link in email
5. Patient sets password and activates account
6. Patient status changes to "Active"
7. Patient can now login

## 🔧 Fix Required: Update Frontend URL

The activation link in invitation emails is currently broken because the `frontend_url` wasn't set in Terraform.

### Step 1: Apply Terraform Update

I've updated `backend/terraform/terraform.tfvars` with your Amplify URL. Now apply it:

```bash
cd backend/terraform

# Review the changes
terraform plan

# Apply the changes
terraform apply

# Confirm with 'yes' when prompted
```

This will update the Lambda environment variable so invitation emails have the correct activation link.

### Step 2: Resend Invitation

After applying Terraform:

1. Go to your app → Patients page
2. Find the patient with "Pending" status
3. Click the **resend invitation** button (envelope icon)
4. Patient will receive a new email with the correct activation link

## 📧 How the Invitation System Works

### For Clinicians:

**Creating a Patient:**
1. Click "Add Patient" button
2. Fill in patient details (email is required)
3. Click "Save Patient"
4. System automatically:
   - Creates patient record with status "Pending"
   - Generates secure activation token (expires in 7 days)
   - Sends invitation email via SNS

**Patient Status:**
- **Pending** (Orange badge) - Invitation sent, waiting for activation
- **Active** (Green badge) - Account activated, patient can login

**Resending Invitations:**
- Click the envelope icon on patient card
- Only available for "Pending" patients
- Generates new token and sends new email

### For Patients:

**Receiving Invitation:**
1. Patient receives email: "Welcome to ClinicaVoice - Activate Your Patient Portal Account"
2. Email contains activation link: `https://your-app.amplifyapp.com/activate?token=xxx`
3. Link expires in 7 days

**Activating Account:**
1. Click activation link in email
2. Opens activation page
3. Set password (must meet requirements):
   - At least 8 characters
   - One lowercase letter
   - One uppercase letter
   - One number
   - Special character recommended
4. Accept terms and conditions
5. Click "Activate Account"
6. Redirected to login page

**Logging In:**
1. Go to app login page
2. Enter email and password (set during activation)
3. Access patient portal

## 🐛 Troubleshooting

### Issue: Activation Link Shows Blank Page

**Cause:** `frontend_url` not set in Terraform  
**Fix:** Apply the Terraform update (Step 1 above)

### Issue: Patient Not Receiving Email

**Possible causes:**

1. **SNS Subscription Not Confirmed**
   - Patient needs to confirm SNS subscription first
   - Check spam folder for "AWS Notification - Subscription Confirmation"
   - Click "Confirm subscription" link

2. **Email Not Valid**
   - Verify patient email is correct
   - Update patient record if needed

3. **SNS Topic Issue**
   - Check CloudWatch logs for patient-invitation Lambda
   - Look for SNS errors

**How to check:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/clinicavoice-patient-invitation-prod --follow

# Check SNS topic
aws sns list-subscriptions-by-topic --topic-arn $(cd backend/terraform && terraform output -raw sns_topic_arn)
```

### Issue: "Invalid activation token"

**Causes:**
- Token expired (7 days old)
- Token already used
- Patient already activated

**Fix:** Resend invitation to generate new token

### Issue: "Account is already activated"

**Cause:** Patient already completed activation  
**Fix:** Patient should login with their existing credentials

### Issue: Password Doesn't Meet Requirements

**Requirements:**
- Minimum 8 characters
- At least one lowercase letter (a-z)
- At least one uppercase letter (A-Z)
- At least one number (0-9)
- Special characters recommended but not required

## 📋 Testing the Flow

### Test Locally:

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Login as clinician**

3. **Create test patient:**
   - Use your own email for testing
   - Click "Add Patient"
   - Fill in details
   - Save

4. **Check email:**
   - Look for invitation email
   - May need to confirm SNS subscription first

5. **Click activation link:**
   - Should open `/activate?token=xxx`
   - Set password
   - Activate account

6. **Login as patient:**
   - Use patient email and password
   - Should see patient portal

### Test on Amplify:

Same steps, but use your Amplify URL instead of localhost.

## 🔐 Security Notes

**Activation Tokens:**
- 256-bit random tokens (very secure)
- Expire after 7 days
- Single-use only
- Stored hashed in database

**Passwords:**
- Minimum 8 characters with complexity requirements
- Stored securely in AWS Cognito
- Never stored in DynamoDB

**Email Delivery:**
- Uses AWS SNS (Simple Notification Service)
- Requires email subscription confirmation
- HIPAA-compliant when configured correctly

## 📊 Monitoring

**Check invitation status:**
```bash
# View patient-invitation Lambda logs
aws logs tail /aws/lambda/clinicavoice-patient-invitation-prod --follow

# View patient-activation Lambda logs
aws logs tail /aws/lambda/clinicavoice-patient-activation-prod --follow
```

**Check SNS deliveries:**
```bash
# List SNS subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn $(cd backend/terraform && terraform output -raw sns_topic_arn)
```

## 🎯 Quick Reference

**Activation Link Format:**
```
https://main.d1xnhpsxdes1pr.amplifyapp.com/activate?token=<64-char-hex-token>
```

**API Endpoints:**
- `POST /patients` - Create patient (triggers invitation)
- `POST /patients/{id}/resend-invitation` - Resend invitation
- `POST /patients/activate` - Activate account (public, no auth)

**Patient Statuses:**
- `pending` - Invitation sent, not activated
- `active` - Account activated, can login
- `inactive` - Account deactivated

## ✅ Summary

To fix the blank activation page:

1. ✅ Apply Terraform update: `cd backend/terraform && terraform apply`
2. ✅ Resend invitation to patient (click envelope icon)
3. ✅ Patient checks email and clicks activation link
4. ✅ Patient sets password and activates account
5. ✅ Patient can now login with email/password

The system is designed to be secure and user-friendly. Once the `frontend_url` is set correctly, everything should work smoothly!
