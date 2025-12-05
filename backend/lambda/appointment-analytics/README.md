# Appointment Analytics Lambda

This Lambda function provides analytics data for appointments, including statistics, trends, and metrics.

## Functionality

### GET /appointments/analytics

Returns comprehensive analytics data for appointments.

**Query Parameters:**
- `startDate` (optional): Filter appointments from this date (YYYY-MM-DD)
- `endDate` (optional): Filter appointments to this date (YYYY-MM-DD)
- `type` (optional): Filter by appointment type (comma-separated: consultation,follow-up,procedure,urgent)
- `status` (optional): Filter by status (comma-separated: scheduled,confirmed,completed,cancelled,no-show)

**Response:**
```json
{
  "statusCounts": {
    "scheduled": 10,
    "confirmed": 5,
    "completed": 50,
    "cancelled": 3,
    "no-show": 2
  },
  "noShowRate": 2.86,
  "cancellationRate": 4.29,
  "averageDurationByType": {
    "consultation": 60,
    "follow-up": 30,
    "procedure": 90,
    "urgent": 45
  },
  "patientVolumeTrends": {
    "daily": [
      { "date": "2025-01-01", "count": 5 },
      { "date": "2025-01-02", "count": 8 }
    ],
    "weekly": [
      { "week": "2025-01-01", "count": 35 }
    ],
    "monthly": [
      { "month": "2025-01", "count": 150 }
    ]
  },
  "summary": {
    "totalAppointments": 70,
    "totalScheduled": 67,
    "completedAppointments": 50,
    "completionRate": 74.63,
    "avgAppointmentsPerDay": 3.5
  }
}
```

## Requirements Validation

This Lambda implements the following requirements:

- **Requirement 20.1**: Appointment counts by status
- **Requirement 20.2**: No-show and cancellation rates
- **Requirement 20.3**: Average duration by type
- **Requirement 20.4**: Patient volume trends (daily, weekly, monthly)
- **Requirement 20.5**: Filterable by date range, type, and status

## Environment Variables

- `APPOINTMENTS_TABLE`: DynamoDB table name for appointments
- `ENVIRONMENT`: Deployment environment (dev/staging/prod)

## Authorization

Only clinicians can access this endpoint. Patients will receive a 403 Forbidden response.

## Deployment

This Lambda is deployed via Terraform as part of the ClinicaVoice infrastructure.

```bash
# Package and deploy
cd backend/terraform
terraform apply
```

## Testing

The Lambda can be tested locally or via API Gateway:

```bash
# Test via API Gateway
curl -H "Authorization: Bearer <token>" \
  "https://api.clinicavoice.ca/appointments/analytics?startDate=2025-01-01&endDate=2025-12-31"
```
