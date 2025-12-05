# Appointments Lambda Function

This Lambda function handles all appointment CRUD operations for the ClinicaVoice platform.

## Features

- **List Appointments**: Query appointments with filtering by date range, patient, or status
- **Get Appointment**: Retrieve detailed appointment information including patient details
- **Create Appointment**: Schedule new appointments with automatic conflict detection
- **Update Appointment**: Modify appointment details or reschedule
- **Update Status**: Change appointment status (scheduled, confirmed, completed, cancelled, no-show)
- **Cancel Appointment**: Cancel appointments with required reason

## API Endpoints

### GET /appointments
List appointments with optional filtering.

**Query Parameters:**
- `startDate` (optional): Filter appointments from this date (YYYY-MM-DD)
- `endDate` (optional): Filter appointments until this date (YYYY-MM-DD)
- `patientId` (optional): Filter appointments for specific patient
- `status` (optional): Filter by status (scheduled, confirmed, completed, cancelled, no-show)
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
{
  "appointments": [...],
  "total": 10
}
```

### GET /appointments/{id}
Get detailed appointment information.

**Response:**
```json
{
  "id": "uuid",
  "userId": "clinician-id",
  "patientId": "patient-id",
  "date": "2025-12-15",
  "time": "14:30",
  "duration": 60,
  "type": "consultation",
  "status": "scheduled",
  "notes": "Patient notes",
  "patient": {
    "id": "patient-id",
    "mrn": "MRN-20251215-1234",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "email": "john@example.com"
  },
  "statusHistory": [...],
  "createdAt": "2025-12-01T10:00:00Z",
  "updatedAt": "2025-12-01T10:00:00Z"
}
```

### POST /appointments
Create a new appointment with conflict checking.

**Request Body:**
```json
{
  "patientId": "patient-id",
  "date": "2025-12-15",
  "time": "14:30",
  "type": "consultation",
  "duration": 60,
  "notes": "Initial consultation"
}
```

**Validation:**
- `patientId` is required and must exist
- `date` is required (YYYY-MM-DD format)
- `time` is required (HH:MM format)
- `type` is required (consultation, follow-up, procedure, urgent)
- `duration` is optional (defaults based on type), must be in 15-minute increments
- Date cannot be in the past
- Time slot must not conflict with existing appointments or time blocks

**Response:** 201 Created with appointment object

**Error Responses:**
- 400 Bad Request: Validation errors
- 404 Not Found: Patient not found
- 409 Conflict: Time slot already booked

### PUT /appointments/{id}
Update appointment details or reschedule.

**Request Body:**
```json
{
  "date": "2025-12-16",
  "time": "15:00",
  "duration": 45,
  "type": "follow-up",
  "notes": "Updated notes"
}
```

**Notes:**
- All fields are optional
- If date/time/duration changes, conflict checking is performed
- Original creation date is preserved (for rescheduling)
- Notes history is maintained

**Response:** 200 OK with updated appointment

### POST /appointments/{id}/status
Update appointment status.

**Request Body:**
```json
{
  "status": "completed",
  "reason": "Optional reason for status change"
}
```

**Valid Statuses:**
- `scheduled`: Initial state
- `confirmed`: Patient confirmed attendance
- `completed`: Appointment finished
- `cancelled`: Appointment cancelled
- `no-show`: Patient did not attend

**Response:** 200 OK with updated appointment

### DELETE /appointments/{id}
Cancel an appointment.

**Request Body:**
```json
{
  "reason": "Patient requested cancellation"
}
```

**Validation:**
- `reason` is required for cancellation

**Response:** 200 OK with success message

## Conflict Detection

The function automatically checks for conflicts when creating or rescheduling appointments:

1. **Appointment Conflicts**: Checks if the time slot overlaps with existing appointments for the same clinician
2. **Time Block Conflicts**: Checks if the time slot overlaps with blocked time (breaks, admin time, etc.)
3. **Cancelled Appointments**: Cancelled appointments are excluded from conflict checking

**Overlap Logic:**
Two appointments overlap if:
- New appointment starts before existing ends AND
- New appointment ends after existing starts

## Default Durations

Each appointment type has a default duration:
- **consultation**: 60 minutes
- **follow-up**: 30 minutes
- **procedure**: 90 minutes
- **urgent**: 45 minutes

## Status History

All status changes are tracked in the `statusHistory` array:
```json
{
  "status": "completed",
  "timestamp": "2025-12-15T15:30:00Z",
  "changedBy": "clinician-id",
  "reason": "Optional reason"
}
```

## Notes History

All notes changes are tracked in the `notesHistory` array:
```json
{
  "notes": "Updated notes text",
  "timestamp": "2025-12-15T15:30:00Z",
  "changedBy": "clinician-id"
}
```

## Environment Variables

- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments
- `PATIENTS_TABLE`: DynamoDB table name for patients
- `TIMEBLOCKS_TABLE`: DynamoDB table name for time blocks
- `ENVIRONMENT`: Deployment environment (dev, staging, prod)

## Authorization

All endpoints require Cognito authentication with `clinician` user type. Patients cannot manage appointments through this API.

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Requirements Validation

This Lambda implements the following requirements:
- **4.1**: Appointment creation with required fields
- **4.2**: Time slot availability validation
- **4.3**: Initial status set to "scheduled"
- **6.1**: Status update functionality
- **6.3**: Cancellation with required reason
- **9.1**: Rescheduling with conflict validation
