# SES Configuration - DEPRECATED
# 
# This file is kept for reference but is no longer used.
# The system now uses SNS for sending patient invitation emails.
# See sns.tf for the current email configuration.
#
# MIGRATION NOTE:
# ---------------
# We switched from SES to SNS because:
# 1. SNS is simpler to set up (no email verification required)
# 2. SNS handles email subscriptions automatically
# 3. No sandbox mode restrictions
# 4. Easier for development and testing
#
# If you need to switch back to SES in the future:
# 1. Uncomment the resources below
# 2. Update patient-invitation Lambda to use SES SDK
# 3. Update Lambda environment variables
# 4. Verify sender email in SES console

# # SES Email Identity (optional - can be done manually in console)
# # Uncomment if you want Terraform to manage the email identity
# #
# # resource "aws_ses_email_identity" "from_email" {
# #   email = var.ses_from_email
# # }

# # Output for reference
# output "ses_configuration" {
#   description = "SES configuration instructions (DEPRECATED - using SNS now)"
#   value = {
#     note = "System now uses SNS for email notifications. See sns.tf"
#   }
# }
