# Design Document

## Overview

The Patient Management and Appointments system extends ClinicaVoice with comprehensive patient record management and appointment scheduling capabilities. This design integrates seamlessly with the existing transcription and medical analysis features, providing a complete clinical workflow from patient registration through appointment scheduling, clinical documentation, and follow-up care.

The system follows a modular architecture with clear separation between patient management, appointment scheduling, and clinical documentation components. All patient and appointment data is stored in DynamoDB with appropriate indexes for efficient querying. The frontend uses React with Material-UI components, maintaining consistency with the existing ClinicaVoice interface.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Patients   │ Appointments │ Transcribe   │   Dashboard    │
│   Pages      │   Pages      │   (Updated)  │   (Updated)    │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway (REST API)                     │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  /patients   │/appointments │ /transcribe  │   /reports     │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌──────────────┬──────────────┬──────────────┬────────────────┐
│   Patient    │ Appointment  │ Transcribe   │    Reports     │
│   Lambda     │   Lambda     │   Lambda     │    Lambda      │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │              │                │
       ▼              ▼              ▼                ▼
┌─────────────────────────────────────────────────────────────┐
│                      DynamoDB                                │
├──────────────┬──────────────┬──────────────┬────────────────┤
│   Patients   │ Appointments │   Reports    │   Templates    │
│   Table      │   Table      │   Table      │   Table        │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### Data Flow

**Patient Creation Flow:**
1. Clinician enters patient information in UI
2. Frontend validates required fields
3. POST /patients with patient data
4. Lambda generates unique MRN
5. Store patient in DynamoDB
6. Return patient record with MRN

**Appointment Scheduling Flow:**
1. Clinician selects patient and time slot
2. Frontend validates time slot availability
3. POST /appointments with appointment data
4. Lambda checks for conflicts
5. Store appointment in DynamoDB
6. Return confirmation

**Transcription Linking Flow:**
1. Clinician creates transcription
2. Select patient from dropdown
3. Store transcription with patientId
4. Patient profile shows linked transcription

## Patient Authentication Flow

### Overview

Patients do not self-register. Instead, clinicians create patient records, and the system sends an invitation email to the patient to activate their account. This approach ensures:
- Clinician controls who gets portal access
- Email verification is built-in
- Patient sets their own secure password
- HIPAA compliance (patient consent)
- Better security (no shared passwords)

### Patient Activation Workflow

```
1. Clinician Creates Patient
   ↓
   - Enters patient demographics including email
   - System generates unique MRN
   - System generates secure activation token
   - Account status set to "pending"
   
2. System Sends Invitation Email
   ↓
   - Email sent to patient's email address
   - Contains activation link with token
   - Token expires in 7 days
   - Can be resent if needed
   
3. Patient Receives Email
   ↓
   - Clicks "Activate Account" link
   - Redirected to activation page
   
4. Patient Sets Password
   ↓
   - Enters secure password (strength validation)
   - Confirms password
   - Submits activation form
   
5. System Activates Account
   ↓
   - Validates token (not expired, not used)
   - Creates Cognito user with patient role
   - Links Cognito user ID to patient record
   - Sets account status to "active"
   - Marks token as used
   
6. Patient Can Log In
   ↓
   - Uses email + password
   - Same login page as clinicians
   - Cognito identifies role (patient)
   - Redirected to patient dashboard
```

### Invitation Email Template

```
Subject: Welcome to ClinicaVoice - Activate Your Patient Portal Account

Hi [Patient First Name],

Dr. [Clinician Name] has created a patient portal account for you in ClinicaVoice.

Your patient portal allows you to:
- View your upcoming appointments
- Access your medical records
- Review your appointment history

To activate your account and set your password, click the button below:

[Activate Account Button]

This activation link will expire in 7 days.

If you didn't expect this email or have questions, please contact your healthcare provider.

---
ClinicaVoice - Secure Medical Documentation
```

### Account Status States

**Pending:**
- Initial state when clinician creates patient
- Invitation sent but not activated
- Patient cannot log in
- Can resend invitation

**Active:**
- Patient has activated account
- Cognito user created and linked
- Patient can log in
- Full portal access

**Inactive:**
- Account deactivated by clinician
- Patient cannot log in
- Can be reactivated

### Security Considerations

**Token Security:**
- Cryptographically secure random token (32 bytes)
- One-time use only
- Expires after 7 days
- Stored hashed in database

**Password Requirements:**
- Minimum 8 characters
- Must include uppercase, lowercase, number
- Must include special character
- Enforced by Cognito password policy

**Email Verification:**
- Email ownership verified through activation
- Prevents unauthorized access
- HIPAA compliant

## Components and Interfaces

### Frontend Components

#### Patient Management Components

**PatientList** (`src/pages/dashboard/Patients.jsx`)
- Displays paginated list of patients
- Search and filter functionality
- Active/inactive patient toggle
- Export to CSV
- Navigate to patient profile

**PatientProfile** (`src/pages/dashboard/PatientProfile.jsx`)
- Patient demographics display
- Transcription history
- Appointment history
- Medical history summary
- Edit patient information

**PatientForm** (`src/components/PatientForm.jsx`)
- Create/edit patient form
- Field validation
- Required field indicators
- Date picker for DOB
- Contact information fields

**PatientSelector** (`src/components/PatientSelector.jsx`)
- Autocomplete dropdown
- Search by name or MRN
- Display patient name and MRN
- Quick add new patient
- Used in transcription page

**PatientCard** (`src/components/PatientCard.jsx`)
- Compact patient information display
- Shows name, age, gender, MRN
- Last visit date
- Active/inactive indicator
- Account status badge (pending/active)
- Resend invitation button (if pending)
- Click to view profile

**PatientActivation** (`src/pages/PatientActivation.jsx`)
- Public page (no auth required)
- Validates activation token
- Password input with strength indicator
- Password confirmation
- Terms and conditions acceptance
- Activates account and creates Cognito user
- Redirects to login on success

#### Appointment Components

**AppointmentCalendar** (`src/pages/dashboard/Appointments.jsx`)
- Calendar view (day/week/month)
- Display appointments
- Click to view/edit appointment
- Drag-and-drop rescheduling (future)
- Color-coded by appointment type
- Blocked time slots display

**AppointmentForm** (`src/components/AppointmentForm.jsx`)
- Create/edit appointment form
- Patient selector
- Date and time picker
- Appointment type dropdown
- Duration selector
- Notes field
- Conflict validation

**AppointmentCard** (`src/components/AppointmentCard.jsx`)
- Compact appointment display
- Patient name and MRN
- Date, time, duration
- Appointment type
- Status indicator
- Quick actions (complete, cancel, reschedule)

**TodayAppointments** (`src/components/TodayAppointments.jsx`)
- Dashboard widget
- Today's appointments list
- Highlight imminent appointments
- Quick status updates
- Navigate to appointment details

### Backend Components

#### Lambda Functions

**patients-handler** (`backend/lambda/patients/index.mjs`)
- GET /patients - List patients with filtering
- GET /patients/{id} - Get patient details
- POST /patients - Create new patient (triggers invitation email)
- PUT /patients/{id} - Update patient
- DELETE /patients/{id} - Soft delete (mark inactive)
- POST /patients/{id}/resend-invitation - Resend activation email

**patient-invitation** (`backend/lambda/patient-invitation/index.mjs`)
- Sends activation email to patient
- Generates secure one-time token
- Stores token with expiration (7 days)

**patient-activation** (`backend/lambda/patient-activation/index.mjs`)
- POST /patients/activate - Activate patient account
- Validates activation token
- Creates Cognito user with patient role
- Links Cognito user to patient record
- Sets account status to active

**appointments-handler** (`backend/lambda/appointments/index.mjs`)
- GET /appointments - List appointments with filtering
- GET /appointments/{id} - Get appointment details
- POST /appointments - Create appointment
- PUT /appointments/{id} - Update appointment
- DELETE /appointments/{id} - Cancel appointment
- POST /appointments/{id}/status - Update status

**patient-search** (`backend/lambda/patient-search/index.mjs`)
- POST /patients/search - Search patients
- Supports name, MRN, phone, email search
- Returns ranked results

### API Endpoints

#### Patient Endpoints

```
GET    /patients
       Query params: status (active/inactive), search, limit, offset
       Returns: { patients: [], total, hasMore }

GET    /patients/{id}
       Returns: { patient, transcriptions, appointments, medicalHistory }

POST   /patients
       Body: { name, dob, gender, phone, email, address, ... }
       Returns: { patient (with generated MRN) }

PUT    /patients/{id}
       Body: { name, phone, email, address, ... }
       Returns: { patient }

DELETE /patients/{id}
       Soft delete - marks as inactive
       Returns: { success: true }

POST   /patients/search
       Body: { query, fields: ['name', 'mrn', 'phone', 'email'] }
       Returns: { results: [] }

POST   /patients/{id}/resend-invitation
       Returns: { success: true, sentAt: timestamp }

POST   /patients/activate
       Body: { token, password }
       Returns: { success: true, patient }
```

#### Appointment Endpoints

```
GET    /appointments
       Query params: startDate, endDate, patientId, status, limit
       Returns: { appointments: [], total }

GET    /appointments/{id}
       Returns: { appointment, patient, transcription }

POST   /appointments
       Body: { patientId, date, time, duration, type, notes }
       Returns: { appointment }

PUT    /appointments/{id}
       Body: { date, time, duration, type, notes }
       Returns: { appointment }

POST   /appointments/{id}/status
       Body: { status, reason }
       Returns: { appointment }

DELETE /appointments/{id}
       Body: { reason }
       Returns: { success: true }
```

## Data Models

### Patient Model

```typescript
interface Patient {
  id: string;                    // UUID
  userId: string;                // Clinician who created
  mrn: string;                   // Medical Record Number (unique)
  
  // Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: string;           // ISO date
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  
  // Contact Information
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  preferredContactMethod: 'phone' | 'email' | 'sms';
  
  // Status
  status: 'active' | 'inactive';
  
  // Patient Portal Authentication
  cognitoUserId: string | null;  // Linked Cognito user after activation
  accountStatus: 'pending' | 'active' | 'inactive';
  invitationToken: string | null; // One-time activation token
  invitationSentAt: string | null;
  invitationExpiresAt: string | null; // Token expires in 7 days
  activatedAt: string | null;
  lastLoginAt: string | null;
  
  // Metadata
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  createdBy: string;             // Clinician ID
  updatedBy: string;             // Clinician ID
  
  // Computed fields (not stored)
  age?: number;                  // Calculated from DOB
  lastVisitDate?: string;        // From appointments
  totalVisits?: number;          // Count of completed appointments
}
```

### Appointment Model

```typescript
interface Appointment {
  id: string;                    // UUID
  userId: string;                // Clinician ID
  patientId: string;             // Patient ID
  
  // Scheduling
  date: string;                  // ISO date (YYYY-MM-DD)
  time: string;                  // Time (HH:MM)
  duration: number;              // Minutes
  type: 'consultation' | 'follow-up' | 'procedure' | 'urgent';
  
  // Status
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  statusHistory: Array<{
    status: string;
    timestamp: string;
    changedBy: string;
    reason?: string;
  }>;
  
  // Notes
  notes: string;
  notesHistory?: Array<{
    notes: string;
    timestamp: string;
    changedBy: string;
  }>;
  
  // Links
  transcriptionId?: string;      // Linked transcription
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  
  // Cancellation
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
}
```

### TimeBlock Model

```typescript
interface TimeBlock {
  id: string;
  userId: string;                // Clinician ID
  
  // Timing
  date: string;                  // ISO date
  startTime: string;             // HH:MM
  endTime: string;               // HH:MM
  
  // Recurrence
  recurrence?: {
    type: 'daily' | 'weekly' | 'custom';
    endDate?: string;
    daysOfWeek?: number[];       // 0-6 (Sunday-Saturday)
  };
  
  // Details
  reason: string;
  type: 'break' | 'admin' | 'meeting' | 'other';
  
  // Metadata
  createdAt: string;
  createdBy: string;
}
```

### DynamoDB Table Structures

**Patients Table**
```
Primary Key: id (String)
Sort Key: userId (String)
GSI1: mrn-index (mrn, userId)
GSI2: status-index (userId, status)
GSI3: lastName-index (userId, lastName)
```

**Appointments Table**
```
Primary Key: id (String)
Sort Key: userId (String)
GSI1: patient-index (patientId, date)
GSI2: date-index (userId, date)
GSI3: status-index (userId, status)
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Patient Management Properties

**Property 1: MRN Uniqueness**
*For any* two patients in the system, their MRNs must be unique.
**Validates: Requirements 1.1**

**Property 2: Required Field Validation**
*For any* patient creation attempt, if required fields (name, DOB, contact) are missing, the creation must fail.
**Validates: Requirements 1.2**

**Property 3: Creation Metadata**
*For any* patient creation, the record must include createdAt timestamp and createdBy clinician ID.
**Validates: Requirements 1.3**

**Property 4: Update Timestamp**
*For any* patient update, the updatedAt timestamp must be updated to the current time.
**Validates: Requirements 1.4**

**Property 5: Search Completeness**
*For any* patient search query, all patients matching name, MRN, DOB, or phone must be returned.
**Validates: Requirements 1.5**

**Property 6: Profile Completeness**
*For any* patient profile view, all demographics, contact info, and MRN must be displayed.
**Validates: Requirements 2.1**

**Property 7: Transcription Association**
*For any* patient with transcriptions, all transcriptions must be displayed in the patient profile.
**Validates: Requirements 2.2**

**Property 8: Appointment Chronological Order**
*For any* patient with appointments, they must be displayed in chronological order.
**Validates: Requirements 2.3**

**Property 9: Patient Selection Storage**
*For any* transcription with a selected patient, the patientId must be stored with the transcription.
**Validates: Requirements 3.2**

**Property 10: Patient Display in Transcription**
*For any* transcription with a patient, the patient's name and MRN must be displayed.
**Validates: Requirements 3.3**

**Property 11: Patient Selector Filtering**
*For any* search query in the patient selector, results must match name or MRN.
**Validates: Requirements 3.4**

**Property 12: Patient Selection Required**
*For any* transcription save attempt without a patient, the save must fail.
**Validates: Requirements 3.5**

**Property 13: Age Calculation**
*For any* patient with a date of birth, the calculated age must equal the difference between current date and DOB in years.
**Validates: Requirements 13.2**

**Property 14: Active Patient Filter**
*For any* default patient list view, only patients with status "active" must be displayed.
**Validates: Requirements 14.2**

**Property 15: Inactive Patient Visibility**
*For any* patient marked as inactive, they must not appear in the default patient list.
**Validates: Requirements 14.1**

### Appointment Management Properties

**Property 16: Appointment Required Fields**
*For any* appointment creation, patientId, date, time, and type must be present or creation fails.
**Validates: Requirements 4.1**

**Property 17: Time Slot Conflict Detection**
*For any* appointment creation, if another appointment exists at the same time for the same clinician, creation must fail.
**Validates: Requirements 4.2, 4.4**

**Property 18: Initial Appointment Status**
*For any* newly created appointment, the status must be "scheduled".
**Validates: Requirements 4.3**

**Property 19: Calendar Appointment Display**
*For any* set of appointments in a time period, all must be displayed in the calendar view.
**Validates: Requirements 5.2**

**Property 20: Appointment Date Filtering**
*For any* date range selection, only appointments within that range must be loaded.
**Validates: Requirements 5.5**

**Property 21: Status Update**
*For any* appointment status change, the status must be updated to one of: scheduled, confirmed, completed, cancelled, no-show.
**Validates: Requirements 6.1**

**Property 22: Cancellation Reason Required**
*For any* appointment cancellation without a reason, the cancellation must fail.
**Validates: Requirements 6.3**

**Property 23: Status Change Metadata**
*For any* appointment status change, updatedAt and updatedBy must be updated.
**Validates: Requirements 6.4**

**Property 24: Status History**
*For any* appointment with status changes, all changes must be recorded in statusHistory.
**Validates: Requirements 6.5**

**Property 25: Patient Search Multi-Field**
*For any* patient search query, results must include patients matching name, MRN, phone, or email.
**Validates: Requirements 7.1**

**Property 26: Search Result Fields**
*For any* patient search result, name, MRN, DOB, and last visit date must be present.
**Validates: Requirements 7.2**

**Property 27: Search Result Sorting**
*For any* search with multiple results, results must be sorted by relevance and last visit date.
**Validates: Requirements 7.5**

**Property 28: Today's Appointments Sorting**
*For any* set of today's appointments, they must be sorted chronologically by time.
**Validates: Requirements 8.1**

**Property 29: Appointment Display Fields**
*For any* appointment display, patient name, time, and type must be shown.
**Validates: Requirements 8.2**

**Property 30: Reschedule Conflict Validation**
*For any* appointment reschedule to a conflicting time, the reschedule must fail.
**Validates: Requirements 9.2**

**Property 31: Reschedule Creation Date Preservation**
*For any* rescheduled appointment, the createdAt timestamp must remain unchanged.
**Validates: Requirements 9.3**

**Property 32: Reschedule Cancellation**
*For any* cancelled reschedule operation, the original appointment details must be retained.
**Validates: Requirements 9.5**

**Property 33: Notes Persistence**
*For any* appointment with notes, the notes must be stored and retrievable.
**Validates: Requirements 10.2, 10.3**

**Property 34: Notes History**
*For any* appointment notes update, the change must be recorded in notesHistory.
**Validates: Requirements 10.4**

**Property 35: Appointment History Completeness**
*For any* patient with past appointments, all must be displayed in appointment history.
**Validates: Requirements 11.1**

**Property 36: Appointment History Status Filter**
*For any* appointment history view, completed, cancelled, and no-show appointments must be included.
**Validates: Requirements 11.2**

**Property 37: Transcription Link Display**
*For any* appointment with an associated transcription, a link must be provided.
**Validates: Requirements 11.3**

**Property 38: Visit Count Accuracy**
*For any* patient, the total visit count must equal the number of completed appointments.
**Validates: Requirements 11.4**

**Property 39: Appointment History Filtering**
*For any* appointment history filter by date range or status, only matching appointments must be displayed.
**Validates: Requirements 11.5**

**Property 40: Default Duration by Type**
*For any* appointment type selection, the correct default duration must be set.
**Validates: Requirements 12.2**

**Property 41: Duration Increment Validation**
*For any* custom duration entry, it must be in 15-minute increments.
**Validates: Requirements 12.3**

**Property 42: Appointment Overlap Prevention**
*For any* two appointments for the same clinician, they must not overlap based on start time and duration.
**Validates: Requirements 12.4**

**Property 43: Export Filter Application**
*For any* data export, the current filters and search criteria must be applied to the exported data.
**Validates: Requirements 15.3**

**Property 44: Export Filename Timestamp**
*For any* export file, the filename must contain a timestamp.
**Validates: Requirements 15.4**

**Property 45: Patient Appointment Display**
*For any* patient with upcoming appointments, they must be displayed in the patient dashboard.
**Validates: Requirements 16.1**

**Property 46: Patient Appointment Fields**
*For any* patient viewing their appointments, date, time, clinician name, and type must be shown.
**Validates: Requirements 16.2**

**Property 47: Patient History Chronological Order**
*For any* patient viewing their appointment history, appointments must be in chronological order.
**Validates: Requirements 17.1**

**Property 48: Patient History Status Filter**
*For any* patient appointment history, only completed appointments must be shown.
**Validates: Requirements 17.4**

**Property 49: Last Visit Date Accuracy**
*For any* patient with completed appointments, the last visit date must be the most recent completed appointment date.
**Validates: Requirements 18.1**

**Property 50: Annual Visit Count**
*For any* patient, the visit count for the past year must equal completed appointments in that period.
**Validates: Requirements 18.2**

**Property 51: Follow-up Flag**
*For any* patient with last visit more than 6 months ago, they must be flagged for follow-up.
**Validates: Requirements 18.3**

**Property 52: Last Visit Sorting**
*For any* patient list sorted by last visit date, patients must be ordered correctly by that date.
**Validates: Requirements 18.4**

**Property 53: Time Block Unavailability**
*For any* blocked time slot, appointments cannot be scheduled during that time.
**Validates: Requirements 19.1**

**Property 54: Time Block Required Fields**
*For any* time block creation without reason or duration, creation must fail.
**Validates: Requirements 19.2**

**Property 55: Time Block Removal**
*For any* removed time block, the time must become available for scheduling.
**Validates: Requirements 19.4**

**Property 56: Appointment Statistics Accuracy**
*For any* time period, appointment counts by status must match actual appointments.
**Validates: Requirements 20.1**

**Property 57: No-Show Rate Calculation**
*For any* set of appointments, the no-show rate must equal (no-shows / total scheduled) * 100.
**Validates: Requirements 20.2**

**Property 58: Average Duration Calculation**
*For any* appointment type, the average duration must be calculated correctly from all appointments of that type.
**Validates: Requirements 20.3**

**Property 59: Patient Volume Trends**
*For any* time period, patient volume must reflect actual appointment counts.
**Validates: Requirements 20.4**

**Property 60: Report Filtering**
*For any* report with filters applied, only data matching the filters must be included.
**Validates: Requirements 20.5**

## Error Handling

### Validation Errors

**Patient Validation:**
- Missing required fields → 400 Bad Request
- Invalid date of birth → 400 Bad Request
- Invalid email format → 400 Bad Request
- Invalid phone format → 400 Bad Request
- Duplicate MRN → 409 Conflict

**Appointment Validation:**
- Missing required fields → 400 Bad Request
- Invalid date/time → 400 Bad Request
- Time slot conflict → 409 Conflict
- Patient not found → 404 Not Found
- Invalid duration → 400 Bad Request
- Past date scheduling → 400 Bad Request

### Database Errors

- DynamoDB unavailable → 503 Service Unavailable
- Timeout → 504 Gateway Timeout
- Throttling → 429 Too Many Requests
- Item not found → 404 Not Found

### Authorization Errors

- Unauthorized access → 401 Unauthorized
- Insufficient permissions → 403 Forbidden
- Patient accessing other patient data → 403 Forbidden

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required field missing: dateOfBirth",
    "field": "dateOfBirth",
    "timestamp": "2025-12-02T12:00:00Z"
  }
}
```

## Testing Strategy

### Unit Testing

**Patient Management:**
- Patient creation with valid data
- Patient creation with missing fields (should fail)
- MRN generation uniqueness
- Patient search by various fields
- Patient update operations
- Active/inactive status changes
- Age calculation from DOB

**Appointment Management:**
- Appointment creation with valid data
- Appointment creation with conflicts (should fail)
- Status updates
- Rescheduling operations
- Time block creation
- Appointment filtering by date range
- Duration validation

**Integration Points:**
- Patient selector in transcription page
- Transcription linking to patients
- Appointment linking to transcriptions
- Dashboard widgets

### Property-Based Testing

Use **fast-check** (JavaScript property-based testing library) with minimum 100 iterations per test.

**Patient Properties:**
- Property 1: MRN Uniqueness
- Property 2: Required Field Validation
- Property 5: Search Completeness
- Property 13: Age Calculation
- Property 14: Active Patient Filter

**Appointment Properties:**
- Property 17: Time Slot Conflict Detection
- Property 18: Initial Appointment Status
- Property 22: Cancellation Reason Required
- Property 28: Today's Appointments Sorting
- Property 42: Appointment Overlap Prevention

Each property-based test must:
- Be tagged with: `**Feature: patient-management-appointments, Property {number}: {property_text}**`
- Run at least 100 iterations
- Generate random valid and invalid inputs
- Verify the property holds for all inputs

### End-to-End Testing

**Patient Workflow:**
1. Create patient
2. Verify patient appears in list
3. Search for patient
4. Update patient information
5. Create transcription linked to patient
6. Verify transcription appears in patient profile

**Appointment Workflow:**
1. Create patient
2. Schedule appointment
3. Verify appointment in calendar
4. Update appointment status
5. Create transcription for appointment
6. Verify appointment history

**Patient Portal Workflow:**
1. Patient logs in
2. Views upcoming appointments
3. Views appointment history
4. Views linked transcriptions

## Performance Considerations

### Database Optimization

**Indexes:**
- Patient MRN index for fast lookup
- Patient lastName index for search
- Appointment date index for calendar queries
- Appointment patient index for patient history

**Query Patterns:**
- Use GSI for filtered queries
- Implement pagination for large result sets
- Cache frequently accessed data (patient demographics)
- Batch operations where possible

### Frontend Optimization

**Component Optimization:**
- Lazy load patient list
- Virtual scrolling for large lists
- Debounce search inputs
- Memoize expensive calculations (age, visit counts)
- Code splitting for patient/appointment pages

**Data Fetching:**
- Prefetch today's appointments on dashboard load
- Cache patient search results
- Optimistic UI updates for status changes
- Background refresh for calendar data

### Scalability

**Current Design Supports:**
- 10,000+ patients per clinician
- 1,000+ appointments per month per clinician
- Sub-second search response times
- Real-time conflict detection

**Future Scaling:**
- ElastiCache for frequently accessed data
- CloudFront for static assets
- DynamoDB auto-scaling
- Lambda concurrency limits

## Security Considerations

### Data Protection

**Encryption:**
- All data encrypted at rest (DynamoDB encryption)
- All data encrypted in transit (HTTPS/TLS)
- Sensitive notes encrypted with KMS

**Access Control:**
- Clinicians can only access their own patients
- Patients can only access their own data
- Role-based access control (RBAC)
- JWT token validation on all requests

### HIPAA Compliance

**Audit Trail:**
- Log all patient data access
- Log all appointment changes
- Track who created/modified records
- Maintain status change history

**Data Retention:**
- Soft delete for patients (mark inactive)
- Maintain appointment history
- Archive old records (future)

### Input Validation

**Frontend:**
- Validate all form inputs
- Sanitize user input
- Prevent XSS attacks
- CSRF protection

**Backend:**
- Validate all API inputs
- Sanitize database queries
- Rate limiting
- SQL injection prevention (N/A for DynamoDB)

## Deployment Strategy

### Database Migration

1. Create Patients table
2. Create Appointments table
3. Create TimeBlocks table
4. Set up GSIs
5. Migrate existing patient names from reports to Patients table

### Backend Deployment

1. Deploy Lambda functions
2. Create API Gateway routes
3. Update IAM policies
4. Test endpoints

### Frontend Deployment

1. Deploy new pages and components
2. Update Transcribe page with patient selector
3. Update Dashboard with appointment widgets
4. Deploy to Amplify

### Rollout Plan

**Phase 1: Patient Management**
- Deploy patient CRUD operations
- Deploy patient list and profile pages
- Update transcribe page with patient selector
- Test with small group of clinicians

**Phase 2: Appointment Scheduling**
- Deploy appointment CRUD operations
- Deploy calendar view
- Deploy dashboard widgets
- Test scheduling workflow

**Phase 3: Integration**
- Link appointments to transcriptions
- Patient portal enhancements
- Analytics and reporting
- Full production rollout

## Future Enhancements

### Phase 2 Features
- Appointment reminders (email/SMS)
- Recurring appointments
- Waitlist management
- Multi-clinician scheduling
- Resource scheduling (rooms, equipment)

### Phase 3 Features
- Patient self-scheduling
- Online appointment requests
- Insurance information
- Emergency contacts
- Family member linking

### Advanced Features
- Telemedicine integration
- Automated appointment confirmations
- No-show prediction
- Optimal scheduling algorithms
- Multi-location support
