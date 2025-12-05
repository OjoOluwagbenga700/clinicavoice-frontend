# 🔧 Fix Patient Invitation Issue

## Problem

When clicking "Resend Invitation", you get error: "Failed to send invitation. Please try again."

## Root Cause

The `frontend_url` environment variable was not set in the patient-invitation Lambda, so it's using the default placeholder value which doesn't match your actual Amplify URL.

## Solution

### Step 1: Apply Terraform Changes

I've updated `backend/terraform/terraform.tfvars` with your correct Amplify URL. Now apply it:

```bash
cd backend/terraform

# Review what will change
terraform plan

# Apply the changes
terraform apply

# Type 'yes' when prompted
```

This will update the Lambda environment variable:
- `FRONTEND_URL` = `https://main.d1xnhpsxdes1pr.amplifyapp.com`

### Step 2: Test Invitation

After Terraform apply completes:

1. Go to your app → Patients page
2. Find the patient with "Pending" status
3. Click the resend invitation button (envelope icon)
4. Should see success message

### Step 3: Check Email

The patient should receive an email with subject:
"Welcome to ClinicaVoice - Activate Your Patient Portal Account"

The email will contain an activation link like:
```
https://main.d1xnhpsxdes1pr.amplifyapp.com/activate?token=<long-token>
```

## Troubleshooting

### Issue: Still getting "Failed to send invitation"

**Check Lambda logs:**
```bash
# Check patient-invitation Lambda logs
aws logs tail /aws/lambda/clinicavoice-patient-invitation-prod --since 5m --follow
```

Look for errors in the output.

**Common errors:**

1. **SNS Permission Error**
   - Error: "User is not authorized to perform: SNS:Publish"
   - Fix: Terraform should have set this up, but verify SNS policy exists

2. **Frontend URL Not Set**
   - Error: "Cannot read property 'FRONTEND_URL'"
   - Fix: Make sure you ran `terraform apply` after updating terraform.tfvars

3. **Patient Not Found**
   - Error: "Patient not found"
   - Fix: Make sure you're using the correct patient ID

### Issue: Email not received

**Possible causes:**

1. **SNS Subscription Not Confirmed**
   - Patient needs to confirm SNS subscription first
   - Check spam folder for "AWS Notification - Subscription Confirmation"
   - Click "Confirm subscription" link
   - Then resend invitation

2. **Email Address Invalid**
   - Verify patient email is correct
   - Update patient record if needed

3. **SNS Topic Issue**
   - Check if SNS topic exists:
   ```bash
   aws sns list-topics | grep patient-invitations
   ```

### Issue: Activation link shows blank page

**This should be fixed now** after applying Terraform changes. The `frontend_url` will be correct.

If still blank:
1. Check browser console (F12) for errors
2. Verify the URL matches your Amplify domain
3. Clear browser cache

## Verification Steps

### 1. Verify Terraform Applied Successfully

```bash
cd backend/terraform

# Check the frontend_url output
terraform output

# Should show your Amplify URL in the Lambda config
```

### 2. Verify Lambda Environment Variable

```bash
# Get Lambda configuration
aws lambda get-function-configuration \
  --function-name clinicavoice-patient-invitation-prod \
  --query 'Environment.Variables.FRONTEND_URL'

# Should output: "https://main.d1xnhpsxdes1pr.amplifyapp.com"
```

### 3. Test Invitation Flow

1. **Resend invitation** - Should succeed without error
2. **Check CloudWatch logs** - Should see "SNS message published successfully"
3. **Check email** - Patient should receive invitation
4. **Click activation link** - Should open activation page (not blank)
5. **Set password** - Should activate account successfully
6. **Login** - Patient should be able to login

## Quick Test

Want to test the whole flow? Use your own email:

1. Create a test patient with your email address
2. Click resend invitation
3. Check your email (and spam folder)
4. You might need to confirm SNS subscription first
5. Then you'll get the invitation email
6. Click the activation link
7. Set a password
8. Login as the patient

## SNS Email Subscription Flow

**Important:** SNS requires email confirmation before sending messages.

**First time a patient receives an invitation:**

1. **Subscription Confirmation Email** (from AWS)
   - Subject: "AWS Notification - Subscription Confirmation"
   - Contains a "Confirm subscription" link
   - Patient must click this link

2. **Invitation Email** (from your app)
   - Subject: "Welcome to ClinicaVoice - Activate Your Patient Portal Account"
   - Contains activation link
   - This comes AFTER confirming subscription

**Subsequent invitations:**
- Only the invitation email (subscription already confirmed)

## Summary

**To fix the invitation issue:**

1. ✅ Run `terraform apply` to update Lambda environment variable
2. ✅ Resend invitation to patient
3. ✅ Patient confirms SNS subscription (first time only)
4. ✅ Patient receives invitation email
5. ✅ Patient clicks activation link
6. ✅ Patient sets password and activates account
7. ✅ Patient can login

The key fix is applying the Terraform changes so the Lambda has the correct `frontend_url`.
