# Time Blocks Lambda

This Lambda function handles CRUD operations for time blocks (blocked time slots) in the ClinicaVoice appointment system.

## Features

- **Create Time Block**: Block time slots for breaks, meetings, admin tasks, etc.
- **List Time Blocks**: Query time blocks with filtering by date range and type
- **Get Time Block**: Retrieve details of a specific time block
- **Update Time Block**: Modify existing time blocks
- **Delete Time Block**: Remove time blocks to make time available again
- **Conflict Detection**: Validates that time blocks don't overlap with existing appointments
- **Recurring Time Blocks**: Support for daily, weekly, and custom recurrence patterns

## API Endpoints

### GET /time-blocks
List time blocks with optional filtering.

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `type` (optional): Filter by type (break, admin, meeting, other)
- `limit` (optional): Maximum number of results (default: 100)

**Response:**
```json
{
  "timeBlocks": [
    {
      "id": "uuid",
      "userId": "clinician-id",
      "date": "2025-12-10",
      "startTime": "12:00",
      "endTime": "13:00",
      "reason": "Lunch break",
      "type": "break",
      "recurrence": null,
      "createdAt": "2025-12-04T10:00:00Z",
      "createdBy": "clinician-id"
    }
  ],
  "total": 1
}
```

### GET /time-blocks/{id}
Get details of a specific time block.

**Response:**
```json
{
  "id": "uuid",
  "userId": "clinician-id",
  "date": "2025-12-10",
  "startTime": "12:00",
  "endTime": "13:00",
  "reason": "Lunch break",
  "type": "break",
  "recurrence": null,
  "createdAt": "2025-12-04T10:00:00Z",
  "createdBy": "clinician-id"
}
```

### POST /time-blocks
Create a new time block.

**Request Body:**
```json
{
  "date": "2025-12-10",
  "startTime": "12:00",
  "endTime": "13:00",
  "reason": "Lunch break",
  "type": "break",
  "recurrence": {
    "type": "daily",
    "endDate": "2025-12-31",
    "daysOfWeek": [1, 2, 3, 4, 5]
  }
}
```

**Required Fields:**
- `date`: Date in YYYY-MM-DD format
- `startTime`: Start time in HH:MM format
- `endTime`: End time in HH:MM format (must be after startTime)
- `reason`: Reason for blocking the time

**Optional Fields:**
- `type`: Type of block (break, admin, meeting, other) - defaults to "other"
- `recurrence`: Recurrence pattern (see below)

**Recurrence Object:**
- `type`: "daily", "weekly", or "custom"
- `endDate` (optional): End date for recurrence (YYYY-MM-DD)
- `daysOfWeek` (optional): Array of days (0-6, Sunday-Saturday)

**Response:**
```json
{
  "id": "uuid",
  "userId": "clinician-id",
  "date": "2025-12-10",
  "startTime": "12:00",
  "endTime": "13:00",
  "reason": "Lunch break",
  "type": "break",
  "recurrence": {...},
  "createdAt": "2025-12-04T10:00:00Z",
  "createdBy": "clinician-id"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `409 Conflict`: Time block conflicts with existing appointment

### PUT /time-blocks/{id}
Update an existing time block.

**Request Body:**
```json
{
  "startTime": "12:30",
  "endTime": "13:30",
  "reason": "Extended lunch break"
}
```

All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "id": "uuid",
  "userId": "clinician-id",
  "date": "2025-12-10",
  "startTime": "12:30",
  "endTime": "13:30",
  "reason": "Extended lunch break",
  "type": "break",
  "recurrence": null,
  "createdAt": "2025-12-04T10:00:00Z",
  "createdBy": "clinician-id"
}
```

**Error Responses:**
- `400 Bad Request`: Validation errors
- `404 Not Found`: Time block not found
- `409 Conflict`: Updated time block conflicts with existing appointment

### DELETE /time-blocks/{id}
Delete a time block.

**Response:**
```json
{
  "success": true,
  "message": "Time block deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Time block not found

## Validation Rules

1. **Date Format**: Must be YYYY-MM-DD
2. **Time Format**: Must be HH:MM (24-hour format)
3. **End Time**: Must be after start time
4. **Type**: Must be one of: break, admin, meeting, other
5. **Recurrence Type**: Must be one of: daily, weekly, custom
6. **Days of Week**: Must be numbers 0-6 (Sunday-Saturday)
7. **Conflict Detection**: Time blocks cannot overlap with existing appointments

## Authorization

Only users with `custom:user_type` = `clinician` can manage time blocks.

## Environment Variables

- `TIMEBLOCKS_TABLE`: DynamoDB table name for time blocks
- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments (for conflict checking)
- `ENVIRONMENT`: Deployment environment (dev, staging, prod)

## Testing

Run tests with:
```bash
npm test
```

## Requirements Validated

This Lambda implements the following requirements from the design document:

- **Requirement 19.1**: Time blocks mark time as unavailable for appointments
- **Requirement 19.2**: Time blocks require reason and duration
- **Requirement 19.4**: Removed time blocks make time available again
- **Requirement 19.5**: Support for recurring time blocks

## Integration with Appointments

The appointments Lambda already checks for time block conflicts when creating or updating appointments. This ensures that:

1. Appointments cannot be scheduled during blocked time
2. Time blocks cannot be created that overlap with existing appointments
3. When a time block is deleted, the time becomes available for scheduling
