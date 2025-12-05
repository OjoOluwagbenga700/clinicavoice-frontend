# Developer Guide: Patient Management & Appointments

## Overview

This comprehensive developer guide covers the Patient Management and Appointments system in ClinicaVoice. This system provides complete patient record management, appointment scheduling, and patient portal functionality.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Development Setup](#development-setup)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Component Library](#component-library)
7. [Backend Services](#backend-services)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Terraform installed
- Access to AWS account

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Run property-based tests
npm run test:properties
```

### Environment Variables

```bash
# Frontend (.env.local)
VITE_API_ENDPOINT=https://api.example.com
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx

# Backend (Terraform)
AWS_REGION=us-east-1
ENVIRONMENT=dev
```

---

## Architecture Overview

### System Architecture

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

### Key Features

**Patient Management:**
- Complete CRUD operations
- Patient search and filtering
- Patient portal authentication
- Account activation workflow
- MRN generation

**Appointment Scheduling:**
- Calendar view (day/week/month)
- Conflict detection
- Status management
- Time block management
- Appointment analytics

**Patient Portal:**
- Secure activation
- View upcoming appointments
- View appointment history
- Access medical records

---

## Development Setup

### Frontend Setup

```bash
# Navigate to project root
cd clinicavoice

# Install dependencies
npm install

# Start development server
npm run dev

# Access at http://localhost:5173
```

### Backend Setup

```bash
# Navigate to backend
cd backend/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply
```

### Database Setup

Tables are automatically created via Terraform:
- `clinicavoice-patients-{env}`
- `clinicavoice-appointments-{env}`
- `clinicavoice-timeblocks-{env}`

---

## API Reference

For complete API documentation, see [DEVELOPER_GUIDE_API.md](./DEVELOPER_GUIDE_API.md)

### Quick Reference

**Patient Endpoints:**
```
GET    /patients              - List patients
GET    /patients/{id}         - Get patient details
POST   /patients              - Create patient
PUT    /patients/{id}         - Update patient
DELETE /patients/{id}         - Delete patient (soft)
POST   /patients/search       - Search patients
POST   /patients/{id}/resend-invitation - Resend activation
POST   /patients/activate     - Activate account (public)
```

**Appointment Endpoints:**
```
GET    /appointments          - List appointments
GET    /appointments/{id}     - Get appointment
POST   /appointments          - Create appointment
PUT    /appointments/{id}     - Update appointment
POST   /appointments/{id}/status - Update status
DELETE /appointments/{id}     - Cancel appointment
GET    /appointments/analytics - Get analytics
```

### Authentication

All endpoints (except `/patients/activate`) require JWT authentication:

```javascript
const response = await fetch('/api/patients', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  }
});
```

---

## Database Schema

For complete database documentation, see [DEVELOPER_GUIDE_DATABASE.md](./DEVELOPER_GUIDE_DATABASE.md)

### Quick Reference

**Patients Table:**
- Primary Key: `id` (UUID)
- Sort Key: `userId` (Clinician ID)
- GSIs: mrn-index, status-index, lastName-index

**Appointments Table:**
- Primary Key: `id` (UUID)
- Sort Key: `userId` (Clinician ID)
- GSIs: patient-index, date-index, status-index

**TimeBlocks Table:**
- Primary Key: `id` (UUID)
- Sort Key: `userId` (Clinician ID)
- GSI: date-index

### Common Queries

```javascript
// Get patient by MRN
const params = {
  TableName: 'clinicavoice-patients-dev',
  IndexName: 'mrn-index',
  KeyConditionExpression: 'mrn = :mrn',
  ExpressionAttributeValues: {
    ':mrn': 'MRN-12345'
  }
};

// Get appointments for date range
const params = {
  TableName: 'clinicavoice-appointments-dev',
  IndexName: 'date-index',
  KeyConditionExpression: 'userId = :userId AND #date BETWEEN :start AND :end',
  ExpressionAttributeNames: {
    '#date': 'date'
  },
  ExpressionAttributeValues: {
    ':userId': clinicianId,
    ':start': '2025-12-01',
    ':end': '2025-12-31'
  }
};
```

---

## Component Library

For complete component documentation, see [DEVELOPER_GUIDE_COMPONENTS.md](./DEVELOPER_GUIDE_COMPONENTS.md)

### Core Components

**Patient Components:**
- `PatientCard` - Compact patient display
- `PatientForm` - Create/edit patient
- `PatientSelector` - Autocomplete patient picker
- `PatientProfile` - Full patient profile page
- `PatientList` - Patient list with search

**Appointment Components:**
- `AppointmentCard` - Compact appointment display
- `AppointmentForm` - Create/edit appointment
- `AppointmentCalendar` - Calendar view
- `TodayAppointments` - Dashboard widget
- `RescheduleDialog` - Reschedule modal

**Shared Components:**
- `PatientActivation` - Public activation page
- `LoadingSpinner` - Loading indicator
- `ErrorDisplay` - Error messages
- `EmptyState` - Empty state displays

### Usage Examples

```jsx
// Patient Selector
import PatientSelector from '@/components/PatientSelector';

<PatientSelector
  value={selectedPatient}
  onChange={setSelectedPatient}
  onAddNew={() => setShowDialog(true)}
  error={errors.patient}
/>

// Appointment Form
import AppointmentForm from '@/components/AppointmentForm';

<AppointmentForm
  appointment={existingAppointment}
  initialPatient={selectedPatient}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={saving}
/>

// Today's Appointments
import TodayAppointments from '@/components/TodayAppointments';

<TodayAppointments
  appointments={todayAppointments}
  onAppointmentClick={handleClick}
  onStatusChange={handleStatusChange}
/>
```

---

## Backend Services

### Lambda Functions

#### Patient Service (`backend/lambda/patients/`)

**Responsibilities:**
- Patient CRUD operations
- MRN generation
- Patient search
- Account status management

**Key Functions:**
```javascript
// Create patient
export const createPatient = async (event) => {
  const data = JSON.parse(event.body);
  const mrn = generateMRN();
  // ... create patient
  // ... trigger invitation email
  return { statusCode: 201, body: JSON.stringify(patient) };
};

// Get patient
export const getPatient = async (event) => {
  const { id } = event.pathParameters;
  // ... fetch patient
  return { statusCode: 200, body: JSON.stringify(patient) };
};
```

#### Appointment Service (`backend/lambda/appointments/`)

**Responsibilities:**
- Appointment CRUD operations
- Conflict detection
- Status management
- Calendar queries

**Key Functions:**
```javascript
// Create appointment
export const createAppointment = async (event) => {
  const data = JSON.parse(event.body);
  // ... check conflicts
  // ... create appointment
  return { statusCode: 201, body: JSON.stringify(appointment) };
};

// Check conflicts
const checkConflicts = async (userId, date, time, duration) => {
  // ... query existing appointments
  // ... check time blocks
  return hasConflict;
};
```

#### Patient Invitation (`backend/lambda/patient-invitation/`)

**Responsibilities:**
- Generate activation tokens
- Send invitation emails via SES
- Token expiration management

**Key Functions:**
```javascript
export const handler = async (event) => {
  const { patientId, email, firstName } = event;
  const token = generateSecureToken();
  const expiresAt = addDays(new Date(), 7);
  
  // Store token
  await storeToken(patientId, token, expiresAt);
  
  // Send email
  await sendInvitationEmail(email, firstName, token);
  
  return { success: true };
};
```

#### Patient Activation (`backend/lambda/patient-activation/`)

**Responsibilities:**
- Validate activation tokens
- Create Cognito users
- Link Cognito to patient record
- Update account status

**Key Functions:**
```javascript
export const handler = async (event) => {
  const { token, password } = JSON.parse(event.body);
  
  // Validate token
  const patient = await validateToken(token);
  
  // Create Cognito user
  const cognitoUser = await createCognitoUser(
    patient.email,
    password,
    'patient'
  );
  
  // Link to patient record
  await linkCognitoUser(patient.id, cognitoUser.Username);
  
  return { statusCode: 200, body: JSON.stringify({ success: true }) };
};
```

#### Patient Search (`backend/lambda/patient-search/`)

**Responsibilities:**
- Multi-field search
- Result ranking
- Fuzzy matching

**Key Functions:**
```javascript
export const handler = async (event) => {
  const { query, fields } = JSON.parse(event.body);
  const userId = event.requestContext.authorizer.claims.sub;
  
  // Search across fields
  const results = await searchPatients(userId, query, fields);
  
  // Rank results
  const ranked = rankResults(results, query);
  
  return { statusCode: 200, body: JSON.stringify({ results: ranked }) };
};
```

#### Appointment Analytics (`backend/lambda/appointment-analytics/`)

**Responsibilities:**
- Calculate appointment statistics
- No-show and cancellation rates
- Average duration by type
- Patient volume trends

**Key Functions:**
```javascript
export const handler = async (event) => {
  const { startDate, endDate, type, status } = event.queryStringParameters;
  const userId = event.requestContext.authorizer.claims.sub;
  
  const appointments = await getAppointments(userId, startDate, endDate);
  
  const analytics = {
    summary: calculateSummary(appointments),
    rates: calculateRates(appointments),
    averageDuration: calculateAverageDuration(appointments, type)
  };
  
  return { statusCode: 200, body: JSON.stringify(analytics) };
};
```

#### Time Blocks (`backend/lambda/time-blocks/`)

**Responsibilities:**
- Time block CRUD operations
- Recurring time blocks
- Conflict validation

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test PatientCard.test.jsx

# Run with coverage
npm test -- --coverage
```

### Property-Based Tests

```bash
# Run property tests
npm run test:properties

# Run specific property test
npm test -- properties/patient.properties.test.js
```

**Example Property Test:**
```javascript
import fc from 'fast-check';

describe('Property: MRN Uniqueness', () => {
  it('should generate unique MRNs for all patients', () => {
    fc.assert(
      fc.property(
        fc.array(patientArbitrary, { minLength: 2, maxLength: 100 }),
        (patients) => {
          const mrns = patients.map(p => p.mrn);
          const uniqueMrns = new Set(mrns);
          return mrns.length === uniqueMrns.size;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e
```

---

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to Amplify
git push origin main
# Amplify auto-deploys from main branch
```

### Backend Deployment

```bash
# Navigate to terraform
cd backend/terraform

# Plan changes
terraform plan

# Apply changes
terraform apply

# Verify deployment
terraform output
```

### Lambda Deployment

```bash
# Deploy specific Lambda
cd backend/lambda/patients
zip -r function.zip .
aws lambda update-function-code \
  --function-name clinicavoice-patients-dev \
  --zip-file fileb://function.zip
```

### Database Migration

```bash
# Create tables
terraform apply -target=aws_dynamodb_table.patients

# Verify tables
aws dynamodb list-tables

# Check indexes
aws dynamodb describe-table --table-name clinicavoice-patients-dev
```

---

## Troubleshooting

### Common Issues

#### 1. Patient Creation Fails

**Symptom:** 500 error when creating patient

**Possible Causes:**
- DynamoDB permissions
- MRN generation collision
- SES email sending failure

**Solution:**
```bash
# Check Lambda logs
aws logs tail /aws/lambda/clinicavoice-patients-dev --follow

# Verify DynamoDB permissions
aws dynamodb describe-table --table-name clinicavoice-patients-dev

# Check SES configuration
aws ses get-account-sending-enabled
```

#### 2. Appointment Conflicts Not Detected

**Symptom:** Overlapping appointments created

**Possible Causes:**
- Date/time parsing issues
- Timezone mismatches
- Query logic errors

**Solution:**
```javascript
// Verify date/time format
console.log('Date:', appointment.date); // Should be YYYY-MM-DD
console.log('Time:', appointment.time); // Should be HH:MM

// Check timezone
console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

// Test conflict detection
const hasConflict = await checkConflicts(userId, date, time, duration);
console.log('Conflict detected:', hasConflict);
```

#### 3. Patient Activation Fails

**Symptom:** Token validation error

**Possible Causes:**
- Expired token
- Token already used
- Cognito user creation failure

**Solution:**
```bash
# Check token expiration
aws dynamodb get-item \
  --table-name clinicavoice-patients-dev \
  --key '{"id": {"S": "patient-id"}}'

# Verify Cognito configuration
aws cognito-idp describe-user-pool \
  --user-pool-id us-east-1_xxxxx

# Check Cognito logs
aws logs tail /aws/lambda/clinicavoice-patient-activation-dev --follow
```

#### 4. Search Not Returning Results

**Symptom:** Patient search returns empty

**Possible Causes:**
- Index not ready
- Query syntax error
- Data isolation issue

**Solution:**
```bash
# Check GSI status
aws dynamodb describe-table \
  --table-name clinicavoice-patients-dev \
  --query 'Table.GlobalSecondaryIndexes[*].[IndexName,IndexStatus]'

# Test query directly
aws dynamodb query \
  --table-name clinicavoice-patients-dev \
  --index-name lastName-index \
  --key-condition-expression 'userId = :userId' \
  --expression-attribute-values '{":userId": {"S": "clinician-id"}}'
```

### Performance Issues

#### Slow Patient List Loading

**Optimization:**
```javascript
// Implement pagination
const [page, setPage] = useState(0);
const [limit] = useState(50);

const fetchPatients = async () => {
  const response = await api.getPatients({
    limit,
    offset: page * limit
  });
  setPatients(response.patients);
};

// Add caching
const cachedPatients = useMemo(() => patients, [patients]);
```

#### High DynamoDB Costs

**Optimization:**
- Use batch operations
- Implement caching
- Optimize query patterns
- Use projection expressions

```javascript
// Use projection expression
const params = {
  TableName: 'clinicavoice-patients-dev',
  ProjectionExpression: 'id, firstName, lastName, mrn',
  // Only fetch needed fields
};
```

### Debugging Tips

**Enable Debug Logging:**
```javascript
// Frontend
localStorage.setItem('debug', 'app:*');

// Backend (Lambda)
console.log('Event:', JSON.stringify(event, null, 2));
console.log('Context:', JSON.stringify(context, null, 2));
```

**Use CloudWatch Insights:**
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

**Monitor API Gateway:**
```bash
# Check API Gateway logs
aws logs tail /aws/apigateway/clinicavoice-api-dev --follow
```

---

## Best Practices

### Code Organization

```
src/
├── components/          # Reusable components
├── pages/              # Page components
├── services/           # API services
├── utils/              # Utility functions
├── hooks/              # Custom hooks
└── context/            # React context

backend/lambda/
├── patients/           # Patient service
├── appointments/       # Appointment service
├── patient-search/     # Search service
└── shared/             # Shared utilities
```

### Error Handling

```javascript
// Frontend
try {
  const patient = await api.createPatient(data);
  setSuccess(true);
} catch (error) {
  if (error.response?.status === 400) {
    setError('Invalid patient data');
  } else if (error.response?.status === 409) {
    setError('Patient already exists');
  } else {
    setError('An error occurred. Please try again.');
  }
}

// Backend
try {
  const result = await dynamodb.putItem(params);
  return { statusCode: 201, body: JSON.stringify(result) };
} catch (error) {
  console.error('Error:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred',
        timestamp: new Date().toISOString()
      }
    })
  };
}
```

### Security

```javascript
// Validate input
const validatePatientData = (data) => {
  if (!data.firstName || !data.lastName) {
    throw new Error('Name is required');
  }
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email');
  }
  // ... more validation
};

// Sanitize output
const sanitizePatient = (patient) => {
  const { invitationToken, ...safe } = patient;
  return safe;
};

// Check authorization
const checkAuthorization = (userId, resourceUserId) => {
  if (userId !== resourceUserId) {
    throw new Error('Unauthorized');
  }
};
```

### Performance

```javascript
// Use React.memo for expensive components
export const PatientCard = React.memo(({ patient, onClick }) => {
  // ... component code
});

// Debounce search input
const debouncedSearch = useMemo(
  () => debounce((query) => searchPatients(query), 300),
  []
);

// Lazy load routes
const Patients = lazy(() => import('./pages/dashboard/Patients'));
const Appointments = lazy(() => import('./pages/dashboard/Appointments'));
```

---

## Additional Resources

### Documentation

- [API Documentation](./DEVELOPER_GUIDE_API.md)
- [Database Schema](./DEVELOPER_GUIDE_DATABASE.md)
- [Component Library](./DEVELOPER_GUIDE_COMPONENTS.md)
- [User Guide - Patient Management](./USER_GUIDE_PATIENT_MANAGEMENT.md)
- [User Guide - Appointment Scheduling](./USER_GUIDE_APPOINTMENT_SCHEDULING.md)
- [User Guide - Patient Portal](./USER_GUIDE_PATIENT_PORTAL.md)

### External Resources

- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

### Support

For development support:
- Review this documentation
- Check component source code
- Review Lambda logs in CloudWatch
- Contact development team
- Submit issues on GitHub

---

## Contributing

### Code Style

- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Write/update tests
4. Update documentation
5. Submit pull request
6. Address review comments
7. Merge after approval

### Testing Requirements

- Unit tests for all new functions
- Property tests for core logic
- Integration tests for API endpoints
- E2E tests for critical workflows
- Minimum 80% code coverage

---

## Changelog

### Version 1.0.0 (2025-12-05)

**Features:**
- Patient CRUD operations
- Appointment scheduling
- Patient portal authentication
- Calendar view
- Search and filtering
- Analytics dashboard
- Export functionality

**Infrastructure:**
- DynamoDB tables with GSIs
- Lambda functions
- API Gateway endpoints
- Cognito authentication
- SES email integration

**Documentation:**
- API documentation
- Database schema
- Component library
- User guides
- Developer guides

---

## License

Copyright © 2025 ClinicaVoice. All rights reserved.
