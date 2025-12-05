# Reports Table (includes transcriptions)
resource "aws_dynamodb_table" "reports" {
  name         = "${var.project_name}-reports-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "PatientIdIndex"
    hash_key        = "patientId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "TypeIndex"
    hash_key        = "type"
    range_key       = "userId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "StatusIndex"
    hash_key        = "status"
    range_key       = "userId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-reports"
  }
}

# Templates Table
resource "aws_dynamodb_table" "templates" {
  name         = "${var.project_name}-templates-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  global_secondary_index {
    name            = "UserIdIndex"
    hash_key        = "userId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-templates"
  }
}

# Patients Table
resource "aws_dynamodb_table" "patients" {
  name         = "${var.project_name}-patients-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "mrn"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "lastName"
    type = "S"
  }

  attribute {
    name = "cognitoUserId"
    type = "S"
  }

  # GSI for MRN lookup (unique identifier)
  global_secondary_index {
    name            = "mrn-index"
    hash_key        = "mrn"
    range_key       = "userId"
    projection_type = "ALL"
  }

  # GSI for filtering by status (active/inactive)
  global_secondary_index {
    name            = "status-index"
    hash_key        = "userId"
    range_key       = "status"
    projection_type = "ALL"
  }

  # GSI for searching by last name
  global_secondary_index {
    name            = "lastName-index"
    hash_key        = "userId"
    range_key       = "lastName"
    projection_type = "ALL"
  }

  # GSI for patient portal access (lookup by Cognito user ID)
  global_secondary_index {
    name            = "cognito-user-index"
    hash_key        = "cognitoUserId"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-patients"
  }
}

# Appointments Table
resource "aws_dynamodb_table" "appointments" {
  name         = "${var.project_name}-appointments-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "patientId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  # GSI for querying appointments by patient
  global_secondary_index {
    name            = "patient-index"
    hash_key        = "patientId"
    range_key       = "date"
    projection_type = "ALL"
  }

  # GSI for querying appointments by date (calendar view)
  global_secondary_index {
    name            = "date-index"
    hash_key        = "userId"
    range_key       = "date"
    projection_type = "ALL"
  }

  # GSI for filtering appointments by status
  global_secondary_index {
    name            = "status-index"
    hash_key        = "userId"
    range_key       = "status"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-appointments"
  }
}

# TimeBlocks Table
resource "aws_dynamodb_table" "timeblocks" {
  name         = "${var.project_name}-timeblocks-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "userId"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # GSI for querying time blocks by date
  global_secondary_index {
    name            = "date-index"
    hash_key        = "userId"
    range_key       = "date"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-timeblocks"
  }
}


