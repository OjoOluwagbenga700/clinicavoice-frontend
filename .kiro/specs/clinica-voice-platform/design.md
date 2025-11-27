# Design Document

## Overview

ClinicaVoice is a React-based single-page application (SPA) that provides clinical transcription and documentation management capabilities. The application uses AWS Amplify for authentication and cloud services, Material-UI (MUI) for the component library, and React Router for navigation. The architecture follows a client-side rendering pattern with serverless backend services.

The system supports two distinct user roles (clinician and patient) with role-based access control enforced at both the UI and API levels. Clinicians have full access to create transcriptions, manage templates, and view reports, while patients have read-only access to their personal medical documentation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React SPA (Vite)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Public     │  │  Clinician   │  │   Patient    │     │
│  │   Routes     │  │     UI       │  │      UI      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
│                   ┌────────▼────────┐                       │
│                   │  Auth Context   │                       │
│                   │  (AWS Amplify)  │                       │
│                   └────────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   AWS Services  │
                    ├─────────────────┤
                    │  • Cognito      │
                    │  • S3           │
                    │  • Transcribe   │
                    │  • API Gateway  │
                    │  • Lambda       │
                    └─────────────────┘
```

### Technology Stack

- **Frontend Framework**: React 18.2 with Vite 4.4 build tool
- **UI Library**: Material-UI (MUI) 5.18 with Emotion styling
- **Routing**: React Router DOM 6.14
- **Authentication**: AWS Amplify 6.15 with Cognito
- **State Management**: React hooks (useState, useEffect, useContext)
- **Internationalization**: i18next 25.6 with react-i18next 16.0
- **Rich Text Editing**: React Quill 2.0
- **Charts**: Recharts 2.6
- **API Communication**: AWS Amplify API module
- **Storage**: AWS S3 via Amplify Storage module

### Architectural Patterns

1. **Component-Based Architecture**: UI is decomposed into reusable React components
2. **Container/Presentational Pattern**: Pages act as containers, components as presentational
3. **Context API**: Theme and authentication state managed via React Context
4. **Serverless Backend**: AWS Lambda functions handle business logic
5. **RESTful API**: API Gateway exposes endpoints for transcription and data operations
6. **Role-Based Access Control (RBAC)**: User roles stored in Cognito custom attributes

## Components and Interfaces

### Core Components

#### Authentication Components

**Login Component** (`src/pages/Login.jsx`)
- Handles user sign-in with email and password
- Integrates with AWS Amplify `signIn` function
- Stores authentication token in session storage
- Redirects to dashboard on success

**Register Component** (`src/pages/Register.jsx`)
- Handles user registration with name, email, password, and user type
- Implements two-step registration: sign-up and email confirmation
- Stores user type as custom Cognito attribute `custom:user_type`
- Supports both "patient" and "clinician" user types

#### Layout Components

**Header Component** (`src/components/Header.jsx`)
- Displays application logo and navigation links
- Shows authentication status and logout button
- Provides language switcher for i18n
- Responsive design with mobile menu

**Sidebar Component** (`src/components/Sidebar.jsx`)
- Permanent drawer navigation for dashboard
- Role-based menu items
- Active route highlighting
- Fixed width of 240px

**DashboardLayout Component** (`src/components/DashboardLayout.jsx`)
- Wraps dashboard pages with sidebar and footer
- Manages layout spacing and responsive behavior
- Provides consistent dashboard structure

#### Dashboard Components

**Overview Component** (`src/pages/dashboard/Overview.jsx`)
- Displays key statistics (active patients, transcriptions, pending reviews)
- Renders activity chart using Recharts
- Shows recent notes with status chips
- Provides quick action buttons
- Fetches data from mock API (to be replaced with real API)

**DashboardCard Component** (`src/components/DashboardCard.jsx`)
- Reusable card for displaying statistics
- Props: title, value
- Consistent styling across dashboard

#### Transcription Components

**Transcribe Component** (`src/pages/dashboard/Transcribe.jsx`)
- Handles audio recording via MediaRecorder API
- Supports audio file upload
- Uploads audio to S3 via Amplify Storage
- Triggers transcription via API Gateway
- Displays transcript in editable text field
- Saves transcript to backend
- Supports loading transcription by report ID via URL parameter

#### Template Management Components

**TemplateBuilder Component** (`src/pages/dashboard/TemplateBuilder.jsx`)
- Manages template CRUD operations
- Integrates React Quill for rich text editing
- Supports placeholder insertion ({{PatientName}}, {{Date}}, etc.)
- Provides live preview with sample data substitution
- Stores templates in component state (to be persisted to backend)

#### Reports Components

**Reports Component** (`src/pages/dashboard/Reports.jsx`)
- Displays list of saved reports in card grid
- Implements client-side search filtering
- Navigates to transcription page with report ID
- Uses mock data (to be replaced with API calls)

### Data Flow

#### Authentication Flow

```
User Input → Login Component → AWS Amplify signIn() → Cognito
                                                         ↓
Session Storage ← Authentication Token ← Success Response
                                                         ↓
                                              Dashboard Redirect
```

#### Transcription Flow

```
Audio Input → Transcribe Component → Amplify Storage (S3)
                                            ↓
                                      File Key Generated
                                            ↓
                                    API Gateway Request
                                            ↓
                                      Lambda Function
                                            ↓
                                    AWS Transcribe Service
                                            ↓
                                    Transcript Response
                                            ↓
                              Editable Text Field Display
```

#### Role-Based Access Flow

```
User Login → Cognito Authentication → Retrieve custom:user_type
                                              ↓
                                    ┌─────────┴─────────┐
                                    │                   │
                              Clinician              Patient
                                    │                   │
                         Full Dashboard          Limited Dashboard
                         All Features            View-Only Reports
```

## Data Models

### User Model

```typescript
interface User {
  id: string;                    // Cognito user ID
  email: string;                 // User email (username)
  name: string;                  // Full name
  userType: 'clinician' | 'patient';  // Role
  createdAt: Date;               // Registration timestamp
  lastLogin?: Date;              // Last authentication time
}
```

### Transcription Model

```typescript
interface Transcription {
  id: string;                    // Unique transcription ID
  userId: string;                // Owner (clinician) ID
  patientId?: string;            // Associated patient ID
  audioFileKey: string;          // S3 object key
  audioFileName: string;         // Original filename
  audioFileSize: number;         // File size in bytes
  transcript: string;            // Transcribed text
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;               // Upload timestamp
  updatedAt: Date;               // Last modification
  metadata?: {
    duration?: number;           // Audio duration in seconds
    language?: string;           // Detected language
    confidence?: number;         // Transcription confidence score
  };
}
```

### Template Model

```typescript
interface Template {
  id: string;                    // Unique template ID
  userId: string;                // Owner (clinician) ID
  name: string;                  // Template name
  content: string;               // Rich text content with placeholders
  placeholders: string[];        // List of placeholder names
  category?: string;             // Template category (SOAP, Progress, etc.)
  isShared: boolean;             // Whether template is shared with team
  createdAt: Date;
  updatedAt: Date;
}
```

### Report Model

```typescript
interface Report {
  id: string;                    // Unique report ID
  transcriptionId: string;       // Associated transcription
  patientId: string;             // Patient the report is about
  clinicianId: string;           // Clinician who created report
  patientName: string;           // Patient full name
  date: Date;                    // Report date
  summary: string;               // Brief summary
  content: string;               // Full report content
  status: 'draft' | 'reviewed' | 'finalized';
  templateId?: string;           // Template used (if any)
  createdAt: Date;
  updatedAt: Date;
}
```

### Dashboard Statistics Model

```typescript
interface DashboardStats {
  activePatients: number;        // Count of active patients
  recentTranscriptions: number;  // Count of recent transcriptions
  pendingReviews: number;        // Count of reports pending review
}

interface ActivityDataPoint {
  date: string;                  // Date in YYYY-MM-DD format
  transcriptions: number;        // Count of transcriptions on that date
}
```

## C
orrectness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After analyzing the acceptance criteria, I've identified the following testable correctness properties. Many criteria involve external integrations (AWS services, browser APIs) or visual/UX concerns that are better validated through integration or manual testing.

### Authentication Properties

**Property 1: User registration creates account with role**
*For any* valid registration data (name, email, password, user type), creating an account should result in a user profile with the specified user type stored as a custom attribute.
**Validates: Requirements 1.1, 1.5**

**Property 2: Valid credentials grant authentication**
*For any* valid user credentials, authentication should succeed and return an authentication token.
**Validates: Requirements 2.1**

**Property 3: Authentication token persistence**
*For any* successful authentication, the authentication token should be stored in session storage.
**Validates: Requirements 2.3**

**Property 4: Protected route access control**
*For any* protected route, attempting to access it without authentication should result in a redirect to the login page.
**Validates: Requirements 2.4**

### Audio Recording Properties

**Property 5: Recording state indicator**
*For any* active recording session, the recording state should be set to true and reflected in the UI.
**Validates: Requirements 3.2**

**Property 6: Audio blob storage**
*For any* completed recording, the audio blob should be stored in component state for transcription.
**Validates: Requirements 3.5**

### File Upload Properties

**Property 7: Valid audio format acceptance**
*For any* file with a valid audio format (webm, mp3, wav, m4a), the file should be accepted for upload.
**Validates: Requirements 4.1**

**Property 8: File object storage**
*For any* selected audio file, the file object should be stored in component state.
**Validates: Requirements 4.2**

### Transcription Properties

**Property 9: Unique S3 key generation**
*For any* audio file uploaded for transcription, a unique S3 key should be generated.
**Validates: Requirements 5.1**

**Property 10: Loading state during transcription**
*For any* transcription in progress, the loading state should be set to true.
**Validates: Requirements 5.3**

**Property 11: Transcript display**
*For any* successful transcription, the transcript text should be displayed in the editable text field.
**Validates: Requirements 5.4**

**Property 12: Transcript state updates**
*For any* modification to the transcript text, the component state should update in real-time.
**Validates: Requirements 6.2**

**Property 13: Transcript persistence**
*For any* transcript save operation, the edited text should be sent to the API for persistence.
**Validates: Requirements 6.3**

### Template Management Properties

**Property 14: Unique template ID generation**
*For any* new template creation, a unique template ID should be generated and the template added to the list.
**Validates: Requirements 7.1**

**Property 15: Template name updates**
*For any* template name edit, the template name in the template list should be updated.
**Validates: Requirements 7.2**

**Property 16: Template formatting preservation**
*For any* template content with formatting (line breaks, text styling), the formatting should be preserved when saved.
**Validates: Requirements 7.3**

**Property 17: Template array updates**
*For any* template save operation, the template in the templates array should be updated with current name and content.
**Validates: Requirements 7.4**

**Property 18: Template deletion and UI update**
*For any* template deletion, the template should be removed from the list and the UI should switch to the first available template.
**Validates: Requirements 7.5**

### Placeholder Properties

**Property 19: Placeholder format consistency**
*For any* placeholder insertion, the text should be formatted as {{PlaceholderName}}.
**Validates: Requirements 8.1**

**Property 20: Template content loading**
*For any* template switch, the template content including all placeholders should be loaded.
**Validates: Requirements 8.4**

**Property 21: Placeholder replacement in preview**
*For any* template with placeholders displayed in preview mode, all placeholders with matching sample data should be replaced.
**Validates: Requirements 9.1**

**Property 22: Preview real-time updates**
*For any* template content change, the preview should update in real-time.
**Validates: Requirements 9.3**

**Property 23: Line break conversion**
*For any* template content with line breaks, the preview should convert them to HTML break tags.
**Validates: Requirements 9.4**

### Reports Properties

**Property 24: All reports display**
*For any* set of saved reports, all reports should be displayed with patient name, date, and summary.
**Validates: Requirements 11.1**

**Property 25: Search filtering**
*For any* search query, the displayed reports should be filtered to only those with patient name or summary containing the search text.
**Validates: Requirements 11.2**

**Property 26: Report navigation**
*For any* report click, the system should navigate to the transcription page with the report ID as a URL parameter.
**Validates: Requirements 11.4**

**Property 27: Report data loading**
*For any* report opened, the associated transcription data should be loaded.
**Validates: Requirements 11.5**

### Internationalization Properties

**Property 28: Language change updates UI**
*For any* language change, all interface text should update to the selected language.
**Validates: Requirements 12.1**

**Property 29: State preservation during language change**
*For any* language change, the current page state and user data should be preserved.
**Validates: Requirements 12.4**

### Responsive Design Properties

**Property 30: Grid column adjustment**
*For any* viewport width, the card grid should adjust column count appropriately.
**Validates: Requirements 13.4**

### Export Properties

**Property 31: CSV export generation**
*For any* transcription data, the export function should generate a valid CSV file.
**Validates: Requirements 14.3**

### Security Properties

**Property 32: Password validation enforcement**
*For any* password input, the system should enforce minimum length and complexity requirements.
**Validates: Requirements 15.1**

**Property 33: Session storage for tokens**
*For any* authentication token storage, session storage should be used.
**Validates: Requirements 15.2**

**Property 34: Session expiration handling**
*For any* expired session, the system should require re-authentication before accessing protected resources.
**Validates: Requirements 15.3**

**Property 35: Authentication headers in API requests**
*For any* API request, the authentication token should be included in the request headers.
**Validates: Requirements 15.4**

**Property 36: Generic authentication error messages**
*For any* authentication failure, the error message should not expose sensitive information about the failure reason.
**Validates: Requirements 15.5**

### Role-Based Access Control Properties

**Property 37: Clinician reports access**
*For any* clinician user, the reports page should display all reports created by that clinician.
**Validates: Requirements 16.4**

**Property 38: Clinician feature access**
*For any* user with clinician role, all clinical documentation features should be accessible.
**Validates: Requirements 16.5**

**Property 39: Patient reports filtering**
*For any* patient user, the reports page should display only reports associated with that patient's account.
**Validates: Requirements 17.2**

**Property 40: Patient transcription access denial**
*For any* patient user attempting to access transcription creation features, access should be denied.
**Validates: Requirements 17.3**

**Property 41: Patient template builder access denial**
*For any* patient user attempting to access template builder features, access should be denied.
**Validates: Requirements 17.4**

**Property 42: Patient view-only access**
*For any* patient user, only view-only operations on personal data should be allowed.
**Validates: Requirements 17.5**

**Property 43: User type retrieval**
*For any* authenticated user, the user type should be retrieved from custom user attributes.
**Validates: Requirements 18.1**

**Property 44: Role-based menu rendering**
*For any* user role, only menu items accessible to that role should be displayed.
**Validates: Requirements 18.2**

**Property 45: Route permission verification**
*For any* route access attempt, the user's role should be verified for permission.
**Validates: Requirements 18.3**

**Property 46: Unauthorized access redirect**
*For any* unauthorized access attempt, the user should be redirected to an appropriate page with an access denied message.
**Validates: Requirements 18.4**

**Property 47: Activity chart data display**
*For any* activity data, the chart should display transcription trends correctly.
**Validates: Requirements 19.4**

**Property 48: Recent transcriptions display**
*For any* set of transcriptions, the most recent ones should be displayed with status indicators.
**Validates: Requirements 19.5**

**Property 49: Patient report read-only mode**
*For any* patient accessing a report, the report should be displayed in read-only mode.
**Validates: Requirements 20.3**

**Property 50: Patient edit prevention**
*For any* patient attempting to modify a report, editing should be prevented with an appropriate message.
**Validates: Requirements 20.5**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Invalid credentials
   - Expired sessions
   - Missing authentication tokens
   - Password validation failures

2. **File Upload Errors**
   - File size exceeds limit (100MB)
   - Invalid file format
   - S3 upload failures
   - Network connectivity issues

3. **Transcription Errors**
   - AWS Transcribe service failures
   - Audio file processing errors
   - API Gateway timeouts
   - Invalid audio format

4. **Template Errors**
   - Invalid template format
   - Missing required fields
   - Placeholder parsing errors
   - Save operation failures

5. **Access Control Errors**
   - Unauthorized route access
   - Role permission violations
   - Missing user type attribute

### Error Handling Strategy

**User-Facing Errors**
- Display clear, actionable error messages using Material-UI Snackbar or Alert components
- Avoid exposing technical details or sensitive information
- Provide retry options where appropriate
- Maintain form state to prevent data loss

**Logging and Monitoring**
- Log errors to browser console in development mode
- Send error reports to AWS CloudWatch in production
- Include error context (user ID, timestamp, action attempted)
- Track error frequency for monitoring

**Graceful Degradation**
- Preserve user data in component state when operations fail
- Allow users to retry failed operations
- Provide alternative workflows when features are unavailable
- Display loading states during async operations

**Validation**
- Client-side validation before API calls
- Server-side validation for all data mutations
- Real-time validation feedback in forms
- Clear indication of required fields

## Testing Strategy

### Unit Testing

**Framework**: Vitest with React Testing Library

**Unit Test Coverage**:
- Component rendering and props
- State management and hooks
- Event handlers and user interactions
- Utility functions and data transformations
- Form validation logic
- Error handling paths

**Example Unit Tests**:
- Login form submission with valid/invalid credentials
- Template placeholder insertion at cursor position
- Report search filtering logic
- Language switcher functionality
- Role-based menu item rendering

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property-based test should run a minimum of 100 iterations to ensure comprehensive coverage across the input space.

**Property Test Tagging**: Each property-based test MUST include a comment tag in the following format:
```javascript
// Feature: clinica-voice-platform, Property X: [property description]
```

**Property Test Coverage**:
Property-based tests will validate universal properties that should hold across all inputs:

- Authentication token storage for any successful login
- Unique ID generation for any new template or transcription
- Search filtering correctness for any query string
- Placeholder format consistency for any placeholder insertion
- Role-based access control for any user role
- File format validation for any uploaded file
- State preservation for any language change
- CSV export format for any transcription data

**Generator Strategies**:
- User data generators (names, emails, passwords, roles)
- Audio file generators (various formats and sizes)
- Template content generators (with and without placeholders)
- Search query generators (empty, partial matches, special characters)
- Viewport size generators (mobile, tablet, desktop)

### Integration Testing

**Framework**: Playwright or Cypress for end-to-end testing

**Integration Test Coverage**:
- Complete authentication flow (register → confirm → login → dashboard)
- Audio recording → upload → transcription → save workflow
- Template creation → placeholder insertion → preview → save workflow
- Report search → view → navigation workflow
- Role-based access control across multiple routes
- Language switching across different pages

### Testing Approach

1. **Test-After-Implementation**: Implement features first, then write corresponding tests
2. **Complementary Testing**: Use both unit tests (specific examples) and property tests (universal rules)
3. **Focus on Core Logic**: Prioritize testing business logic over UI rendering
4. **Mock External Services**: Mock AWS Amplify, S3, and Transcribe services in tests
5. **Test User Workflows**: Ensure critical user journeys work end-to-end

### Test Organization

```
src/
  components/
    Header.jsx
    Header.test.jsx
  pages/
    Login.jsx
    Login.test.jsx
  utils/
    validation.js
    validation.test.js
  __tests__/
    properties/
      authentication.property.test.js
      templates.property.test.js
      reports.property.test.js
```

### Continuous Integration

- Run all tests on every pull request
- Require passing tests before merge
- Generate code coverage reports
- Set minimum coverage threshold (80%)
- Run property tests with increased iterations in CI (500+)
