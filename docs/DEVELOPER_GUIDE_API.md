# API Documentation - Patient Management & Appointments

## Overview

This document provides comprehensive API documentation for the Patient Management and Appointments system in ClinicaVoice. All endpoints use REST principles and return JSON responses.

## Table of Contents

1. [Authentication](#authentication)
2. [Patient Endpoints](#patient-endpoints)
3. [Appointment Endpoints](#appointment-endpoints)
4. [Search Endpoints](#search-endpoints)
5. [Analytics Endpoints](#analytics-endpoints)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)

---

## Authentication

### Overview

All API endpoints require authentication using AWS Cognito JWT tokens.

### Headers

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Token Validation

- Tokens are validated on every request
- Expired tokens return 401 Unauthorized
- Invalid tokens return 401 Unauthorized
- Missing tokens return 401 Unauthorized

### User Context

The authenticated user's ID is extracted from the JWT token and used for:
- Data isolation (clinicians see only their patients)
- Audit logging (tracking who made changes)
- Authorization (role-based access control)

---

## Patient Endpoints

### List Patients

Retrieve a paginated list of patients for the authenticated clinician.

**Endpoint**: `GET /patients`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: "active" or "inactive" (default: "active") |
| search | string | No | Search term for name, MRN, phone, or email |
| limit | number | No | Number of results per page (default: 50, max: 100) |
| offset | number | No | Pagination offset (default: 0) |

**Response**: `200 OK`
```json
{
  "patients": [
    {
      "id": "uuid",
      "mrn": "MRN-12345",
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1980-01-15",
      "gender": "male",
      "phone": "+1234567890",
      "email": "john.doe@example.com",
      "status": "active",
      "accountStatus": "active",
      "age": 45,
      "lastVisitDate": "2025-11-20",
      "totalVisits": 12
    }
  ],
  "total": 150,
  "hasMore": true
}
```

### Get Patient Details

**Endpoint**: `GET /patients/{id}`

**Response**: `200 OK` - Returns detailed patient information including transcriptions, appointments, and medical history.

### Create Patient

**Endpoint**: `POST /patients`

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-20",
  "gender": "female",
  "phone": "+1234567890",
  "email": "jane.smith@example.com",
  "address": {
    "street": "456 Oak Ave",
    "city": "Toronto",
    "province": "ON",
    "postalCode": "M2B 2B2",
    "country": "Canada"
  }
}
```

**Response**: `201 Created` - Returns created patient with auto-generated MRN and sends invitation email.

### Update Patient

**Endpoint**: `PUT /patients/{id}`

Updates patient information. MRN cannot be changed.

### Delete Patient

**Endpoint**: `DELETE /patients/{id}`

Soft delete - marks patient as inactive.

### Resend Invitation

**Endpoint**: `POST /patients/{id}/resend-invitation`

Resends activation email to patient.

### Activate Account

**Endpoint**: `POST /patients/activate`

**Request Body**:
```json
{
  "token": "activation-token",
  "password": "SecureP@ssw0rd!"
}
```

Public endpoint (no auth required) for patient account activation.

---

## Appointment Endpoints

### List Appointments

**Endpoint**: `GET /appointments`

**Query Parameters**:
- startDate, endDate: Filter by date range
- patientId: Filter by patient
- status: Filter by status

### Get Appointment

**Endpoint**: `GET /appointments/{id}`

Returns appointment details with patient information.

### Create Appointment

**Endpoint**: `POST /appointments`

**Request Body**:
```json
{
  "patientId": "patient-uuid",
  "date": "2025-12-15",
  "time": "10:00",
  "duration": 30,
  "type": "consultation",
  "notes": "Initial consultation"
}
```

**Appointment Types**: consultation, follow-up, procedure, urgent

**Response**: `201 Created` or `409 Conflict` if time slot unavailable.

### Update Appointment

**Endpoint**: `PUT /appointments/{id}`

Reschedule or modify appointment details.

### Update Status

**Endpoint**: `POST /appointments/{id}/status`

**Request Body**:
```json
{
  "status": "completed",
  "reason": "Optional reason"
}
```

**Valid Statuses**: scheduled, confirmed, completed, cancelled, no-show

### Cancel Appointment

**Endpoint**: `DELETE /appointments/{id}`

**Request Body**:
```json
{
  "reason": "Cancellation reason required"
}
```

---

## Search Endpoints

### Search Patients

**Endpoint**: `POST /patients/search`

**Request Body**:
```json
{
  "query": "search term",
  "fields": ["name", "mrn", "phone", "email"]
}
```

Returns ranked search results.

---

## Analytics Endpoints

### Appointment Analytics

**Endpoint**: `GET /appointments/analytics`

**Query Parameters**:
- startDate, endDate: Date range (required)
- type, status: Optional filters

**Response**:
```json
{
  "summary": {
    "totalAppointments": 120,
    "completed": 70,
    "cancelled": 8,
    "noShow": 2
  },
  "rates": {
    "noShowRate": 1.67,
    "cancellationRate": 6.67
  },
  "averageDuration": {
    "consultation": 32,
    "followUp": 16
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "field": "fieldName",
    "timestamp": "2025-12-05T20:00:00Z"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid input data |
| UNAUTHORIZED | 401 | Authentication failed |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Resource conflict |
| INTERNAL_ERROR | 500 | Server error |

---

## Rate Limiting

- Standard endpoints: 100 requests/minute
- Search endpoints: 30 requests/minute
- Analytics endpoints: 10 requests/minute

**Rate Limit Headers**:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1733432400
```

---

## Best Practices

### Pagination
- Use offset and limit for large result sets
- Check hasMore flag for additional pages

### Error Handling
- Check HTTP status codes
- Parse error responses
- Implement retry with exponential backoff

### Security
- Use HTTPS for all requests
- Never log JWT tokens
- Follow HIPAA compliance
- Validate all input

### Performance
- Batch requests when possible
- Use appropriate filters
- Implement client-side caching

---

## Support

For API support:
- Review this documentation
- Check error codes
- Contact development team
