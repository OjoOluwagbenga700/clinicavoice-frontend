# SNS Email Migration - Patient Invitations

## Overview

The patient invitation system has been migrated from AWS SES (Simple Email Service) to AWS SNS (Simple Notification Service) for simpler setup and immediate functionality.

## What Changed

### Before (SES)
- Required email verification in AWS Console
- Sandbox mode restrictions (could only send to verified emails)
- Required production access request (24-hour approval)
- HTML email support
- Custom sender email address

### After (SNS)
- ✅ No email verification required
- ✅ No sandbox mode restrictions
- ✅ Works immediately after deployment
- ✅ Simpler configuration
- ⚠️ Plain text emails only
- ⚠️ Two-step process (subscription confirmation + activation)

## Files Modified

### Terraform Configuration

1. **`backend/terraform/sns.tf`** (NEW)
   - Created SNS topic for patient invitations
   - Added IAM policy for Lambda to publish to SNS
   - Attached policy to patient-invitation Lambda role

2. **`backend/terraform/lambda.tf`**
   - Updated patient-invitation Lambda environment variables
   - Changed `FROM_EMAIL` to `SNS_TOPIC_ARN`

3. **`backend/terraform/ses.tf`**
   - Deprecated (kept for reference)
   - Commented out all resources
   - Added migration notes

### Lambda Function

4. **`backend/lambda/patient-invitation/index.mjs`**
   - Replaced SES SDK with SNS SDK
   - Updated `sendInvitationEmail()` to use SNS
   - Added `subscribeEmailToTopic()` function
   - Simplified email template (plain text only)

5. **`backend/lambda/patient-invitation/package.json`**
   - Replaced `@aws-sdk/client-ses` with `@aws-sdk/client-sns`

6. **`backend/lambda/patient-invitation/README.md`**
   - Updated setup instructions for SNS
   - Removed SES verification steps
   - Added SNS-specific troubleshooting
   - Updated cost estimates

## How It Works Now

### Patient Creation Flow

```
1. Clinician creates patient with email
   ↓
2. Lambda generates secure activation token
   ↓
3. Lambda publishes message to SNS topic
   ↓
4. Lambda subscribes patient email to SNS topic
   ↓
5. AWS SNS sends subscription confirmation email
   ↓
6. Patient clicks "Confirm subscription" link
   ↓
7. Patient receives activation email with portal link
   ↓
8. Patient clicks activation link and sets password
```

### Email Flow

**Email 1: Subscription Confirmation**
```
Subject: AWS Notification - Subscription Confirmation
From: AWS Notifications

You have chosen to subscribe to the topic:
arn:aws:sns:us-east-1:xxx:clinicavoice-patient-invitations-prod

To confirm this subscription, click or visit the link below:
https://sns.us-east-1.amazonaws.com/...

If you did not subscribe, please ignore this message.
```

**Email 2: Patient Activation** (sent after confirmation)
```
Subject: Welcome to ClinicaVoice - Activate Your Patient Portal Account
From: AWS Notifications

Hi [Patient Name],

[Clinician Name] has created a patient portal account for you...

To activate your account, visit:
https://your-app.com/activate?token=xxx

This link expires in 7 days.
```

## Deployment Steps

### 1. Update Dependencies

```bash
cd backend/lambda/patient-invitation
npm install
```

### 2. Deploy Infrastructure

```bash
cd backend/terraform
terraform init
terraform apply
```

This will:
- Create SNS topic
- Update Lambda function
- Configure IAM permissions
- Deploy all changes

### 3. Test

Create a test patient:
```bash
POST /patients
{
  "firstName": "Test",
  "lastName": "Patient",
  "email": "your-email@example.com",
  "dateOfBirth": "1990-01-01",
  "phone": "555-0100"
}
```

Check your email for:
1. SNS subscription confirmation (click to confirm)
2. Patient activation email (after confirmation)

## Advantages

### Immediate Benefits
- ✅ **No setup required** - Works immediately after deployment
- ✅ **No verification** - No need to verify sender or recipient emails
- ✅ **No restrictions** - Can send to any email address
- ✅ **Simpler testing** - Test with any email without verification

### Cost Benefits
- ✅ **Free tier:** 1,000 emails/month free
- ✅ **Lower cost:** $2 per 100,000 emails (vs SES $10 per 100,000)
- ✅ **No minimum:** Pay only for what you use

### Development Benefits
- ✅ **Faster iteration** - No waiting for email verification
- ✅ **Easier debugging** - Simpler error messages
- ✅ **Less configuration** - Fewer environment variables

## Limitations

### User Experience
- ⚠️ **Two-step process:** Patients must confirm subscription first
- ⚠️ **Plain text only:** No HTML formatting or styling
- ⚠️ **Generic sender:** Emails from "AWS Notifications"

### Technical
- ⚠️ **Subscription management:** Need to handle unsubscribes
- ⚠️ **No templates:** Can't use email templates
- ⚠️ **Limited customization:** Less control over email appearance

## Migration Back to SES (If Needed)

If you need HTML emails or custom branding, you can migrate back to SES:

### 1. Uncomment SES Configuration

Edit `backend/terraform/ses.tf`:
```hcl
resource "aws_ses_email_identity" "from_email" {
  email = var.ses_from_email
}
```

### 2. Update Lambda Code

Revert `backend/lambda/patient-invitation/index.mjs` to use SES SDK.

### 3. Update Environment Variables

In `backend/terraform/lambda.tf`:
```hcl
environment_variables = {
  FROM_EMAIL = var.ses_from_email
  # Remove SNS_TOPIC_ARN
}
```

### 4. Verify Email in SES

1. Go to AWS Console > SES
2. Verify your sender email
3. Request production access

## Troubleshooting

### Patient Didn't Receive Email

**Check 1:** Did they confirm the SNS subscription?
- Look for "AWS Notification - Subscription Confirmation" email
- Check spam folder

**Check 2:** Is the email address correct?
- Verify in patient record
- Check for typos

**Check 3:** Check CloudWatch Logs
```bash
aws logs tail /aws/lambda/clinicavoice-patient-invitation-prod --follow
```

### SNS Subscription Not Working

**Check 1:** Verify SNS topic exists
```bash
aws sns list-topics
```

**Check 2:** Check Lambda permissions
- Lambda needs `sns:Publish` and `sns:Subscribe` permissions
- Verify IAM role has correct policies

**Check 3:** Check environment variables
```bash
aws lambda get-function-configuration \
  --function-name clinicavoice-patient-invitation-prod \
  --query 'Environment.Variables'
```

### Email Goes to Spam

**Solution 1:** Add AWS to safe senders
- Add `no-reply@sns.amazonaws.com` to contacts

**Solution 2:** Check email content
- Avoid spam trigger words
- Keep message professional

**Solution 3:** Consider SES migration
- SES has better deliverability
- Can configure SPF/DKIM records

## Cost Comparison

### SNS (Current)
- **Free tier:** 1,000 emails/month
- **Cost:** $2.00 per 100,000 emails
- **Example:** 10,000 patients/month = $0.18/month

### SES (Previous)
- **Free tier:** 62,000 emails/month (from Lambda)
- **Cost:** $0.10 per 1,000 emails
- **Example:** 10,000 patients/month = $1.00/month

**Winner:** SNS for small volumes (<62,000/month), SES for large volumes

## Monitoring

### CloudWatch Metrics

Monitor these metrics:
- `NumberOfMessagesPublished` - SNS messages sent
- `NumberOfNotificationsFailed` - Failed deliveries
- Lambda invocation count
- Lambda error rate

### CloudWatch Logs

Check logs for:
- Token generation
- SNS publish success/failure
- Email subscription status
- Error messages

### SNS Console

Monitor in AWS Console:
- Topic subscriptions count
- Delivery success rate
- Failed deliveries
- Subscription confirmations

## Security Considerations

### Token Security
- ✅ 256-bit cryptographically secure tokens
- ✅ One-time use only
- ✅ 7-day expiration
- ✅ Stored hashed in DynamoDB

### Email Security
- ✅ HTTPS activation links
- ✅ No sensitive data in emails
- ✅ Subscription confirmation required
- ✅ Unsubscribe option available

### HIPAA Compliance
- ✅ No PHI in email content
- ✅ Secure token generation
- ✅ Audit trail in CloudWatch
- ✅ Encrypted data at rest

## Future Enhancements

### Short Term
- [ ] Add email templates for better formatting
- [ ] Implement retry logic for failed deliveries
- [ ] Add email delivery tracking
- [ ] Create admin dashboard for monitoring

### Long Term
- [ ] Consider SES migration for HTML emails
- [ ] Implement custom email domain
- [ ] Add multi-language support
- [ ] Create email preference management

## Support

For questions or issues:
1. Check CloudWatch Logs
2. Review this documentation
3. Check AWS SNS Console
4. Contact development team

## References

- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [SNS Email Notifications](https://docs.aws.amazon.com/sns/latest/dg/sns-email-notifications.html)
- [Patient Invitation Lambda README](../backend/lambda/patient-invitation/README.md)
- [Terraform SNS Configuration](../backend/terraform/sns.tf)
