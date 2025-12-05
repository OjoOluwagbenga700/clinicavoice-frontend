# Component Documentation

## Overview

This document provides comprehensive documentation for all React components in the Patient Management and Appointments system. Each component is documented with its purpose, props, usage examples, and implementation details.

## Table of Contents

1. [Patient Components](#patient-components)
2. [Appointment Components](#appointment-components)
3. [Shared Components](#shared-components)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [Best Practices](#best-practices)

---

## Patient Components

### PatientCard

**Location**: `src/components/PatientCard.jsx`

**Purpose**: Displays patient information in a compact card format for list views.

**Props**:
```typescript
interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
  onResendInvitation?: (patientId: string) => void;
}
```

**Features**:
- Displays name, age, gender, MRN
- Shows last visit date
- Active/inactive status indicator
- Account status badge (pending/active)
- Resend invitation button (if pending)
- Click to view full profile

**Usage**:
```jsx
<PatientCard
  patient={patientData}
  onClick={() => navigate(`/patients/${patient.id}`)}
  onResendInvitation={handleResendInvitation}
/>
```

**Styling**:
- Material-UI Card component
- Responsive design
- Hover effects
- Status color coding

---

### PatientForm

**Location**: `src/components/PatientForm.jsx`

**Purpose**: Form for creating and editing patient records.

**Props**:
```typescript
interface PatientFormProps {
  patient?: Patient;
  onSubmit: (data: PatientFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Features**:
- All demographic fields
- Contact information fields
- Address input
- Field validation
- Required field indicators
- Date picker for DOB
- Save/cancel actions
- Error handling

**Form Fields**:
- First Name (required)
- Last Name (required)
- Date of Birth (required)
- Gender (required)
- Phone (required)
- Email (required)
- Address (optional)
- Preferred Contact Method

**Validation**:
- Required field validation
- Email format validation
- Phone format validation
- Date validation
- Real-time error display

**Usage**:
```jsx
<PatientForm
  patient={existingPatient}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={saving}
/>
```

---

### PatientSelector

**Location**: `src/components/PatientSelector.jsx`

**Purpose**: Autocomplete dropdown for selecting patients.

**Props**:
```typescript
interface PatientSelectorProps {
  value: Patient | null;
  onChange: (patient: Patient | null) => void;
  onAddNew?: () => void;
  disabled?: boolean;
  error?: string;
}
```

**Features**:
- Autocomplete search
- Search by name or MRN
- Real-time filtering
- Display patient name, MRN, age
- Quick add new patient option
- Keyboard navigation
- Loading states

**Usage**:
```jsx
<PatientSelector
  value={selectedPatient}
  onChange={setSelectedPatient}
  onAddNew={() => setShowNewPatientDialog(true)}
  error={errors.patient}
/>
```

**Search Behavior**:
- Debounced search (300ms)
- Minimum 2 characters
- Searches name and MRN
- Ranked results
- Highlights matches

---

### PatientProfile

**Location**: `src/pages/dashboard/PatientProfile.jsx`

**Purpose**: Comprehensive patient profile page.

**Features**:
- Patient demographics display
- Edit patient button
- Transcription history section
- Appointment history section
- Medical history summary
- Account status management

**Sections**:
1. **Demographics**: Name, DOB, gender, contact info
2. **Account Status**: Portal access status, invitation management
3. **Appointments**: Upcoming and past appointments
4. **Transcriptions**: Linked clinical documentation
5. **Medical History**: Diagnoses, medications, allergies

**Actions**:
- Edit patient information
- Schedule new appointment
- Create transcription
- Resend portal invitation
- Mark active/inactive

**Usage**:
```jsx
// Accessed via route
<Route path="/patients/:id" element={<PatientProfile />} />
```

---

### PatientList (Patients Page)

**Location**: `src/pages/dashboard/Patients.jsx`

**Purpose**: Main patient list page with search and filtering.

**Features**:
- Patient table/card view
- Search bar with real-time filtering
- Active/inactive toggle
- Pagination
- Export to CSV
- Navigate to patient profile
- Add new patient button

**State Management**:
```typescript
const [patients, setPatients] = useState<Patient[]>([]);
const [searchTerm, setSearchTerm] = useState('');
const [showInactive, setShowInactive] = useState(false);
const [page, setPage] = useState(0);
const [loading, setLoading] = useState(false);
```

**Search Features**:
- Multi-field search (name, MRN, phone, email)
- Debounced input
- Real-time results
- Clear search button

**Export Features**:
- CSV format
- Applies current filters
- Timestamp in filename
- All patient fields included

---

## Appointment Components

### AppointmentCard

**Location**: `src/components/AppointmentCard.jsx`

**Purpose**: Displays appointment information in a compact card format.

**Props**:
```typescript
interface AppointmentCardProps {
  appointment: Appointment;
  patient?: Patient;
  onStatusChange?: (id: string, status: string) => void;
  onReschedule?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: () => void;
}
```

**Features**:
- Patient name and MRN
- Date, time, duration
- Appointment type
- Status indicator
- Quick action buttons
- Color-coded by type

**Quick Actions**:
- Mark as completed
- Cancel appointment
- Reschedule
- View details

**Usage**:
```jsx
<AppointmentCard
  appointment={appointmentData}
  patient={patientData}
  onStatusChange={handleStatusChange}
  onReschedule={handleReschedule}
  onCancel={handleCancel}
/>
```

---

### AppointmentForm

**Location**: `src/components/AppointmentForm.jsx`

**Purpose**: Form for creating and editing appointments.

**Props**:
```typescript
interface AppointmentFormProps {
  appointment?: Appointment;
  initialPatient?: Patient;
  initialDate?: string;
  initialTime?: string;
  onSubmit: (data: AppointmentFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Features**:
- Patient selector
- Date picker
- Time picker (15-min increments)
- Appointment type dropdown
- Duration selector
- Notes field
- Conflict validation
- Save/cancel actions

**Form Fields**:
- Patient (required)
- Date (required)
- Time (required)
- Type (required)
- Duration (auto-filled, editable)
- Notes (optional)

**Validation**:
- Required field validation
- Date/time validation
- Conflict checking
- Duration validation (15-min increments)
- Past date prevention

**Conflict Detection**:
- Checks existing appointments
- Checks blocked time slots
- Real-time validation
- Error messages with suggestions

**Usage**:
```jsx
<AppointmentForm
  appointment={existingAppointment}
  initialPatient={selectedPatient}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  isLoading={saving}
/>
```

---

### RescheduleDialog

**Location**: `src/components/RescheduleDialog.jsx`

**Purpose**: Modal dialog for rescheduling appointments.

**Props**:
```typescript
interface RescheduleDialogProps {
  open: boolean;
  appointment: Appointment;
  onConfirm: (newDate: string, newTime: string) => void;
  onCancel: () => void;
}
```

**Features**:
- Shows current appointment details
- Date picker for new date
- Time picker for new time
- Conflict validation
- Confirm/cancel actions

**Usage**:
```jsx
<RescheduleDialog
  open={showReschedule}
  appointment={selectedAppointment}
  onConfirm={handleRescheduleConfirm}
  onCancel={() => setShowReschedule(false)}
/>
```

---

### TodayAppointments

**Location**: `src/components/TodayAppointments.jsx`

**Purpose**: Dashboard widget showing today's appointments.

**Props**:
```typescript
interface TodayAppointmentsProps {
  appointments: Appointment[];
  onAppointmentClick?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}
```

**Features**:
- Today's appointments list
- Chronological sorting
- Highlight imminent appointments (within 1 hour)
- Quick status updates
- Navigate to appointment details
- Empty state for no appointments

**Highlighting**:
- Imminent appointments (< 1 hour): Orange
- Current appointments: Green
- Past appointments: Gray
- Future appointments: Default

**Usage**:
```jsx
<TodayAppointments
  appointments={todayAppointments}
  onAppointmentClick={handleClick}
  onStatusChange={handleStatusChange}
/>
```

---

### PatientAppointmentHistory

**Location**: `src/components/PatientAppointmentHistory.jsx`

**Purpose**: Displays appointment history for a patient.

**Props**:
```typescript
interface PatientAppointmentHistoryProps {
  patientId: string;
  limit?: number;
  showAll?: boolean;
}
```

**Features**:
- Past appointments list
- Chronological order (newest first)
- Status indicators
- Links to transcriptions
- Filter by date range
- Pagination

**Usage**:
```jsx
<PatientAppointmentHistory
  patientId={patient.id}
  limit={10}
  showAll={false}
/>
```

---

### PatientUpcomingAppointments

**Location**: `src/components/PatientUpcomingAppointments.jsx`

**Purpose**: Shows upcoming appointments for a patient (patient portal view).

**Props**:
```typescript
interface PatientUpcomingAppointmentsProps {
  patientId: string;
}
```

**Features**:
- Upcoming appointments only
- Highlight appointments within 24 hours
- Show clinician name
- Show appointment type
- Empty state with request option

**Usage**:
```jsx
<PatientUpcomingAppointments
  patientId={currentUser.patientId}
/>
```

---

### AppointmentCalendar (Appointments Page)

**Location**: `src/pages/dashboard/Appointments.jsx`

**Purpose**: Main calendar view for managing appointments.

**Features**:
- Calendar view (day/week/month)
- Display appointments with patient names
- Color-coded by appointment type
- Display blocked time slots
- Click appointment to view details
- Navigate between dates
- Add new appointment
- Filter by status

**View Modes**:
- Day: Hourly breakdown
- Week: 7-day view
- Month: Monthly overview

**Color Coding**:
- Consultation: Blue
- Follow-up: Green
- Procedure: Yellow
- Urgent: Red
- Blocked time: Gray

**State Management**:
```typescript
const [view, setView] = useState<'day' | 'week' | 'month'>('week');
const [currentDate, setCurrentDate] = useState(new Date());
const [appointments, setAppointments] = useState<Appointment[]>([]);
const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
```

---

## Shared Components

### PatientActivation

**Location**: `src/pages/PatientActivation.jsx`

**Purpose**: Public page for patient account activation.

**Features**:
- Token validation
- Password input with strength indicator
- Password confirmation
- Terms acceptance
- Success/error handling
- Redirect to login

**Form Fields**:
- Password (required)
- Confirm Password (required)
- Accept Terms (required)

**Password Requirements**:
- Minimum 8 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character

**Usage**:
```jsx
// Public route
<Route path="/activate" element={<PatientActivation />} />
```

**URL Parameters**:
- token: Activation token from email

---

## Component Architecture

### Component Hierarchy

```
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Footer
├── Dashboard
│   ├── Overview
│   │   ├── TodayAppointments
│   │   └── PatientStats
│   ├── Patients
│   │   ├── PatientCard (multiple)
│   │   └── PatientForm (dialog)
│   ├── PatientProfile
│   │   ├── PatientAppointmentHistory
│   │   └── TranscriptionList
│   └── Appointments
│       ├── AppointmentCalendar
│       ├── AppointmentCard (multiple)
│       ├── AppointmentForm (dialog)
│       └── RescheduleDialog
└── PatientActivation (public)
```

### Component Communication

**Props Down, Events Up**:
- Parent components pass data via props
- Child components emit events via callbacks
- No direct child-to-child communication

**Example**:
```jsx
// Parent
<PatientCard
  patient={patient}
  onClick={() => handlePatientClick(patient.id)}
/>

// Child
const PatientCard = ({ patient, onClick }) => {
  return (
    <Card onClick={onClick}>
      {/* content */}
    </Card>
  );
};
```

---

## State Management

### Local State

**useState** for component-specific state:
```jsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState([]);
```

### API State

**useEffect** for data fetching:
```jsx
useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.getPatients();
      setData(response.patients);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [dependencies]);
```

### Form State

**Controlled components**:
```jsx
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: ''
});

const handleChange = (field) => (event) => {
  setFormData({
    ...formData,
    [field]: event.target.value
  });
};
```

### Global State (Future)

Consider React Context or Redux for:
- User authentication
- Theme preferences
- Notification system
- Shared patient/appointment data

---

## Best Practices

### Component Design

✅ **Do**:
- Keep components small and focused
- Use prop types or TypeScript
- Implement error boundaries
- Handle loading states
- Provide empty states
- Use semantic HTML
- Follow accessibility guidelines

❌ **Don't**:
- Create god components
- Mix business logic with presentation
- Ignore error handling
- Skip loading indicators
- Forget empty states
- Use divs for everything
- Ignore keyboard navigation

### Performance

✅ **Do**:
- Use React.memo for expensive components
- Implement virtualization for long lists
- Debounce search inputs
- Lazy load routes
- Optimize re-renders
- Use production builds

❌ **Don't**:
- Premature optimization
- Inline function definitions in render
- Create new objects/arrays in render
- Forget to cleanup effects
- Ignore bundle size

### Accessibility

✅ **Do**:
- Use ARIA labels
- Implement keyboard navigation
- Provide focus indicators
- Use semantic HTML
- Test with screen readers
- Ensure color contrast

❌ **Don't**:
- Rely only on color
- Skip alt text
- Ignore keyboard users
- Use non-semantic elements
- Forget focus management

### Testing

✅ **Do**:
- Write unit tests for logic
- Test user interactions
- Test error states
- Test loading states
- Test accessibility
- Use testing library best practices

❌ **Don't**:
- Test implementation details
- Skip edge cases
- Ignore error scenarios
- Test only happy paths
- Forget integration tests

---

## Component Patterns

### Container/Presentational Pattern

**Container** (smart component):
```jsx
const PatientListContainer = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  return (
    <PatientList
      patients={patients}
      loading={loading}
      onPatientClick={handleClick}
    />
  );
};
```

**Presentational** (dumb component):
```jsx
const PatientList = ({ patients, loading, onPatientClick }) => {
  if (loading) return <LoadingSpinner />;
  
  return (
    <div>
      {patients.map(patient => (
        <PatientCard
          key={patient.id}
          patient={patient}
          onClick={() => onPatientClick(patient.id)}
        />
      ))}
    </div>
  );
};
```

### Compound Components

```jsx
<AppointmentCard appointment={appointment}>
  <AppointmentCard.Header />
  <AppointmentCard.Body />
  <AppointmentCard.Actions />
</AppointmentCard>
```

### Render Props

```jsx
<DataFetcher
  url="/api/patients"
  render={({ data, loading, error }) => (
    loading ? <Spinner /> :
    error ? <Error message={error} /> :
    <PatientList patients={data} />
  )}
/>
```

### Custom Hooks

```jsx
const usePatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.getPatients();
      setPatients(data.patients);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  return { patients, loading, error, refetch: fetchPatients };
};

// Usage
const PatientList = () => {
  const { patients, loading, error } = usePatients();
  // ...
};
```

---

## Styling Guidelines

### Material-UI Theme

```jsx
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

### Component Styling

**Prefer**:
- Material-UI sx prop
- Styled components
- CSS modules

**Avoid**:
- Inline styles (except dynamic values)
- Global CSS
- !important

**Example**:
```jsx
<Box
  sx={{
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    p: 3,
  }}
>
  {/* content */}
</Box>
```

---

## Error Handling

### Error Boundaries

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorDisplay />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```jsx
try {
  const response = await api.createPatient(data);
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
```

---

## Support

For component development support:
- Review this documentation
- Check component source code
- Review Material-UI documentation
- Contact frontend team
- Submit pull requests with improvements
