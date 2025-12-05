# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 Bucket Name"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "S3 Bucket ARN"
  value       = aws_s3_bucket.main.arn
}

# API Gateway Outputs
output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_gateway_url" {
  description = "API Gateway Invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_gateway_endpoint" {
  description = "API Gateway Endpoint (for frontend config)"
  value       = aws_api_gateway_stage.main.invoke_url
}

# DynamoDB Outputs
output "reports_table_name" {
  description = "DynamoDB Reports Table Name"
  value       = aws_dynamodb_table.reports.name
}

output "templates_table_name" {
  description = "DynamoDB Templates Table Name"
  value       = aws_dynamodb_table.templates.name
}

output "patients_table_name" {
  description = "DynamoDB Patients Table Name"
  value       = aws_dynamodb_table.patients.name
}

output "appointments_table_name" {
  description = "DynamoDB Appointments Table Name"
  value       = aws_dynamodb_table.appointments.name
}

output "timeblocks_table_name" {
  description = "DynamoDB TimeBlocks Table Name"
  value       = aws_dynamodb_table.timeblocks.name
}



# Frontend Configuration
output "frontend_config" {
  description = "Configuration for frontend amplifyConfig.js"
  value = {
    cognito_user_pool_id        = aws_cognito_user_pool.main.id
    cognito_user_pool_client_id = aws_cognito_user_pool_client.main.id
    api_gateway_endpoint        = aws_api_gateway_stage.main.invoke_url
    s3_bucket_name              = aws_s3_bucket.main.id
    aws_region                  = var.aws_region
  }
}

# Cognito Identity Pool Output
output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID for S3 uploads"
  value       = aws_cognito_identity_pool.main.id
}

# SNS Outputs
output "sns_topic_arn" {
  description = "ARN of the SNS topic for patient invitations"
  value       = aws_sns_topic.patient_invitations.arn
}

output "sns_configuration" {
  description = "SNS configuration information"
  value = {
    topic_name = aws_sns_topic.patient_invitations.name
    topic_arn  = aws_sns_topic.patient_invitations.arn
    note       = "Patients will receive email invitations via SNS when created"
  }
}
