# Patient Activation Lambda

This Lambda function handles patient account activation for the ClinicaVoice patient portal.

## Overview

When a clinician creates a patient record, an invitation email is sent to the patient with an activation link. This Lambda processes the activation request, validates the token, creates a Cognito user with the patient role, and links it to the patient record.

## API Endpoint

**POST /patients/activate**

Public endpoint (no authentication required)

### Request Body

```json
{
  "token": "activation-token-from-email",
  "password": "SecurePassword123"
}
```

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Account activated successfully",
  "patient": {
    "id": "patient-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "accountStatus": "active",
    "activatedAt": "2025-12-04T12:00:00Z"
  }
}
```

**Error (400):**
```json
{
  "error": "Invalid token",
  "message": "Activation token has expired"
}
```

## Password Requirements

- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- Special characters recommended but not required

## Token Validation

- Token must exist in the database
- Token must not be expired (7 days from invitation)
- Account must not already be active
- Token is single-use (cleared after activation)

## Cognito User Creation

The Lambda creates a Cognito user with:
- Username: patient's email
- Email verified: true
- Custom attribute: `user_type = "patient"`
- Password: as provided by the patient

## Environment Variables

- `PATIENTS_TABLE`: DynamoDB table name for patients
- `USER_POOL_ID`: Cognito User Pool ID
- `ENVIRONMENT`: Deployment environment (dev/prod)

## IAM Permissions Required

- DynamoDB: Scan, UpdateItem on Patients table
- Cognito: AdminCreateUser, AdminSetUserPassword, AdminUpdateUserAttributes

## Testing

### Manual Testing

1. Create a patient record via the patients Lambda
2. Check email for activation link
3. Click link or copy token
4. Visit `/activate?token=xxx` in the frontend
5. Set password and activate account
6. Log in with email and password

### API Testing

```bash
curl -X POST https://api.example.com/patients/activate \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-activation-token",
    "password": "SecurePassword123"
  }'
```

## Error Handling

- **Invalid token**: Token not found or already used
- **Expired token**: Token older than 7 days
- **Already active**: Account already activated
- **Weak password**: Password doesn't meet requirements
- **Cognito errors**: User already exists, etc.

## Security Considerations

- Token is cryptographically secure (32 bytes)
- Token is single-use and cleared after activation
- Password strength is validated
- Email is verified through activation process
- HIPAA compliant workflow
