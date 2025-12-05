# Patient Invitation System - Setup Guide

## Overview

This Lambda function sends patient portal activation emails via AWS SNS. Patients receive an email with a secure activation link to set their password and access the portal.

**Note:** This system uses SNS instead of SES for simpler setup and no email verification requirements.

## Quick Setup with SNS

### 1. Update Terraform Configuration

Edit `backend/terraform/terraform.tfvars`:

```hcl
frontend_url = "https://your-amplify-domain.amplifyapp.com"  # Your Amplify URL
```

### 2. Deploy the Infrastructure

```bash
cd backend/terraform
terraform apply
```

This will automatically create:
- SNS topic for patient invitations
- Lambda function with SNS permissions
- All necessary IAM roles and policies

### 3. How It Works

When a patient is created:

1. **Lambda generates** a secure activation token
2. **Lambda publishes** a message to the SNS topic
3. **Lambda subscribes** the patient's email to the topic
4. **AWS SNS sends** a subscription confirmation email to the patient
5. **Patient confirms** the subscription by clicking the link in the email
6. **Patient receives** the activation email with the portal link

### 4. Testing

To test the invitation system:

1. Create a patient with a valid email address:
   ```bash
   POST /patients
   {
     "firstName": "Test",
     "lastName": "Patient",
     "email": "test@example.com",
     "dateOfBirth": "1990-01-01",
     "phone": "555-0100"
   }
   ```

2. The patient will receive two emails:
   - **First email:** SNS subscription confirmation (click to confirm)
   - **Second email:** Patient portal activation link

3. Patient clicks the activation link and sets their password

### 5. No Verification Required!

Unlike SES, SNS doesn't require:
- ❌ Email address verification
- ❌ Sandbox mode restrictions
- ❌ Production access requests
- ✅ Works immediately after deployment

## Email Template

Patients receive a professional HTML email with:
- Welcome message with their name
- List of portal features (appointments, records, history)
- Prominent "Activate Account" button
- Activation link (expires in 7 days)
- Plain text fallback for email clients that don't support HTML

## Security Features

- **Secure tokens:** 256-bit cryptographically secure random tokens
- **One-time use:** Tokens are invalidated after activation
- **Expiration:** Tokens expire after 7 days
- **HTTPS only:** Activation links use HTTPS
- **Hashed storage:** Tokens stored securely in DynamoDB

## API Endpoints

### Automatic Invitation (on patient creation)
When a patient is created with an email address, an invitation is automatically sent.

```bash
POST /patients
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "patient@example.com",
  "dateOfBirth": "1990-01-01",
  "phone": "555-0100"
}
```

### Resend Invitation
```bash
POST /patients/{patientId}/resend-invitation
```

## Troubleshooting

### Email Not Received

1. **Check spam folder:**
   - SNS emails may be filtered to spam initially
   - Look for "AWS Notification" emails

2. **Verify subscription:**
   - Patient must click "Confirm subscription" in the first email
   - Without confirmation, they won't receive the activation email

3. **Check CloudWatch Logs:**
   ```bash
   aws logs tail /aws/lambda/clinicavoice-patient-invitation-prod --follow
   ```

4. **Check SNS topic subscriptions:**
   - Go to AWS Console > SNS > Topics
   - Find your patient-invitations topic
   - Check subscriptions list

### SNS Sending Limits

- **Free tier:** 1,000 email notifications/month
- **After free tier:** $2.00 per 100,000 emails
- **No daily limits** (unlike SES sandbox mode)
- **No verification required**

### Common Errors

**Error: "Failed to subscribe email to SNS"**
- Solution: Check Lambda has SNS:Subscribe permission
- Check CloudWatch logs for detailed error

**Error: "SNS topic not found"**
- Solution: Ensure Terraform has created the SNS topic
- Check SNS_TOPIC_ARN environment variable

**Patient didn't receive activation email**
- Solution: Patient must confirm SNS subscription first
- Check if they received the "AWS Notification - Subscription Confirmation" email

## Cost Estimate

- **SNS:** $2.00 per 100,000 emails (after 1,000 free/month)
- **Lambda:** Included in free tier for typical usage
- **DynamoDB:** Minimal cost for token storage

For 100 patients/month: **FREE** (within free tier)
For 1,000 patients/month: **FREE** (within free tier)
For 10,000 patients/month: ~$0.18/month

## Advantages of SNS over SES

✅ **No email verification required**
✅ **No sandbox mode restrictions**
✅ **No production access request needed**
✅ **Simpler setup and configuration**
✅ **Works immediately after deployment**
✅ **Lower cost for small volumes**

## Limitations

⚠️ **Two-step process:** Patients must confirm SNS subscription before receiving activation email
⚠️ **Plain text only:** SNS emails are plain text (no HTML formatting)
⚠️ **Generic sender:** Emails come from "AWS Notifications" instead of custom sender

## Migration to SES (Optional)

If you need HTML emails or custom sender addresses, you can migrate to SES:

1. See `backend/terraform/ses.tf` for SES configuration
2. Update `patient-invitation/index.mjs` to use SES SDK
3. Verify sender email in SES console
4. Request production access if needed

## Next Steps

After setup:
1. Deploy the infrastructure with Terraform
2. Test with a real email address
3. Update frontend with activation page (task 6.2)
4. Monitor CloudWatch logs for any issues

## Support

For issues:
1. Check CloudWatch Logs
2. Verify SNS topic exists
3. Ensure Terraform variables are correct
4. Check IAM permissions for Lambda
5. Verify patient confirmed SNS subscription
