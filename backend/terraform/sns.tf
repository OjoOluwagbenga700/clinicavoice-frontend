# SNS Configuration for Patient Invitation Emails
# 
# SNS will send email notifications to patients when they are created
# The patient's email address will be used as the endpoint

# SNS Topic for Patient Invitations
resource "aws_sns_topic" "patient_invitations" {
  name         = "${var.project_name}-patient-invitations-${var.environment}"
  display_name = "ClinicaVoice Patient Invitations"

  tags = {
    Name        = "${var.project_name}-patient-invitations"
    Environment = var.environment
  }
}
