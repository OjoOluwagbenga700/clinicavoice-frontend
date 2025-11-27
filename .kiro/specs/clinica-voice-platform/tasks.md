# Implementation Plan

## Current Status Analysis
The codebase has basic authentication (Login/Register with AWS Cognito), dashboard layout with sidebar navigation, transcription functionality with audio recording/upload, template builder with React Quill, reports page with search, and i18n support (English/French). **Critical gap: No role-based access control** - all users see the same interface regardless of role (clinician vs patient). Also missing: testing infrastructure, file validation, error handling improvements, and backend API integration for data persistence.

## Tasks

- [x] 1. Create role-based access control foundation
  - Create `src/utils/auth.js` with functions to retrieve user type from Cognito custom attributes
  - Create `src/hooks/useUserRole.js` custom hook for accessing current user role
  - Create `src/components/ProtectedRoute.jsx` component that checks user role and permissions
  - Add role constants (CLINICIAN, PATIENT) to a config file
  - _Requirements: 18.1, 18.3_

- [ ]* 1.1 Write property test for user type retrieval
  - **Property 43: User type retrieval**
  - **Validates: Requirements 18.1**

- [ ]* 1.2 Write property test for route permission verification
  - **Property 45: Route permission verification**
  - **Validates: Requirements 18.3**

- [x] 2. Implement role-based routing in App.jsx
  - Wrap dashboard routes with ProtectedRoute component
  - Add role-based route guards for transcribe, templates, and reports
  - Implement unauthorized access redirect to appropriate page
  - Add access denied message display
  - _Requirements: 2.4, 18.3, 18.4_

- [ ]* 2.1 Write property test for unauthorized access redirect
  - **Property 46: Unauthorized access redirect**
  - **Validates: Requirements 18.4**

- [x] 3. Update Sidebar for role-based navigation
  - Modify Sidebar component to accept user role as prop
  - Filter menu items based on user role (clinician vs patient)
  - Hide "Transcribe" and "Template Builder" from patients
  - Show patient-specific menu items (My Reports, My Profile)
  - Update navigation labels for patient view
  - _Requirements: 16.1, 16.2, 17.1, 18.2_

- [ ]* 3.1 Write property test for role-based menu rendering
  - **Property 44: Role-based menu rendering**
  - **Validates: Requirements 18.2**

- [x] 4. Implement clinician-specific dashboard features
  - Ensure Overview component shows all clinician statistics
  - Verify clinicians can access transcription creation
  - Verify clinicians can access template builder
  - Ensure clinicians see all their reports in Reports page
  - Add clinician-specific quick actions
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 19.1, 19.2, 19.3_

- [ ]* 4.1 Write property test for clinician reports access
  - **Property 37: Clinician reports access**
  - **Validates: Requirements 16.4**

- [ ]* 4.2 Write property test for clinician feature access
  - **Property 38: Clinician feature access**
  - **Validates: Requirements 16.5**

- [x] 5. Implement patient-specific dashboard features
  - Create simplified patient dashboard view in Overview component
  - Filter reports to show only patient's own reports
  - Hide transcription and template creation features
  - Add patient profile view component
  - Show patient-specific navigation and quick actions
  - _Requirements: 17.1, 17.2, 20.1, 20.2, 20.4_

- [ ]* 5.1 Write property test for patient reports filtering
  - **Property 39: Patient reports filtering**
  - **Validates: Requirements 17.2**

- [x] 6. Implement read-only mode for patient reports
  - Add read-only prop to Reports component
  - Disable editing controls when user is patient
  - Show "managed by clinician" message for patients
  - Prevent navigation to transcription edit for patients
  - Display appropriate access denied messages
  - _Requirements: 17.3, 17.4, 17.5, 20.3, 20.5_

- [ ]* 6.1 Write property test for patient transcription access denial
  - **Property 40: Patient transcription access denial**
  - **Validates: Requirements 17.3**

- [ ]* 6.2 Write property test for patient template access denial
  - **Property 41: Patient template builder access denial**
  - **Validates: Requirements 17.4**

- [ ]* 6.3 Write property test for patient view-only access
  - **Property 42: Patient view-only access**
  - **Validates: Requirements 17.5**

- [ ]* 6.4 Write property test for patient report read-only mode
  - **Property 49: Patient report read-only mode**
  - **Validates: Requirements 20.3**

- [ ]* 6.5 Write property test for patient edit prevention
  - **Property 50: Patient edit prevention**
  - **Validates: Requirements 20.5**

- [x] 7. Checkpoint - Ensure role-based access control works
  - Test clinician login and verify full access
  - Test patient login and verify restricted access
  - Verify unauthorized access redirects work
  - Ask the user if questions arise

- [x] 8. Set up testing infrastructure
  - Install and configure Vitest and React Testing Library
  - Install and configure fast-check for property-based testing
  - Create test utilities and helper functions
  - Set up test file structure in `src/__tests__/properties/`
  - Configure test scripts in package.json
  - _Requirements: All (testing foundation)_

- [ ]* 8.1 Write property test for authentication token storage
  - **Property 3: Authentication token persistence**
  - **Validates: Requirements 2.3**

- [ ]* 8.2 Write property test for password validation
  - **Property 32: Password validation enforcement**
  - **Validates: Requirements 15.1**

- [x] 9. Implement file upload validation in Transcribe component
  - Add file format validation for audio files (webm, mp3, wav, m4a)
  - Implement file size limit check (100MB)
  - Add error messages for invalid file format
  - Add error messages for file size exceeded
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 9.1 Write property test for audio format validation
  - **Property 7: Valid audio format acceptance**
  - **Validates: Requirements 4.1**

- [x] 10. Enhance error handling across application
  - Add generic error messages for authentication failures (don't expose details)
  - Improve microphone access error handling in Transcribe
  - Add transcription error handling with retry option
  - Add file upload error handling
  - Implement template save/delete error handling
  - _Requirements: 15.5, 2.2, 3.4, 4.3, 4.4, 5.5, 6.5_

- [ ]* 10.1 Write property test for generic auth error messages
  - **Property 36: Generic authentication error messages**
  - **Validates: Requirements 15.5**

- [x] 11. Implement session expiration handling
  - Add session expiration detection
  - Implement automatic redirect to login on expired session
  - Add authentication headers to API requests
  - Clear session storage on logout
  - _Requirements: 2.5, 15.3, 15.4_

- [ ]* 11.1 Write property test for session expiration
  - **Property 34: Session expiration handling**
  - **Validates: Requirements 15.3**

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Enhance template management with backend persistence
  - Connect template save to backend API
  - Connect template delete to backend API
  - Load templates from backend on component mount
  - Add loading states for template operations
  - Ensure unique template ID generation uses backend
  - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [ ]* 11.1 Write property test for unique template ID
  - **Property 14: Unique template ID generation**
  - **Validates: Requirements 7.1**

- [ ]* 11.2 Write property test for template name updates
  - **Property 15: Template name updates**
  - **Validates: Requirements 7.2**

- [ ]* 11.3 Write property test for template deletion
  - **Property 18: Template deletion and UI update**
  - **Validates: Requirements 7.5**

- [x] 12. Enhance reports with backend integration
  - Connect reports page to backend API
  - Implement report data loading by ID from backend
  - Add loading indicators for reports
  - Ensure empty search results message displays correctly
  - _Requirements: 11.1, 11.4, 11.5_

- [ ]* 12.1 Write property test for reports display
  - **Property 24: All reports display**
  - **Validates: Requirements 11.1**

- [ ]* 12.2 Write property test for search filtering
  - **Property 25: Search filtering**
  - **Validates: Requirements 11.2**

- [ ]* 12.3 Write property test for report navigation
  - **Property 26: Report navigation**
  - **Validates: Requirements 11.4**

- [ ]* 12.4 Write property test for report data loading
  - **Property 27: Report data loading**
  - **Validates: Requirements 11.5**

- [x] 13. Enhance dashboard overview with backend data
  - Connect dashboard statistics to backend API
  - Connect activity chart to backend API
  - Connect recent notes to backend API
  - Add loading indicators for dashboard data
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 19.4, 19.5_

- [ ]* 13.1 Write property test for activity chart
  - **Property 47: Activity chart data display**
  - **Validates: Requirements 19.4**

- [ ]* 13.2 Write property test for recent transcriptions
  - **Property 48: Recent transcriptions display**
  - **Validates: Requirements 19.5**

- [x] 14. Implement CSV export functionality
  - Add CSV export function for reports
  - Ensure CSV includes patient name, date, and summary
  - Connect export button in Overview to CSV generation
  - _Requirements: 14.3_

- [ ]* 14.1 Write property test for CSV export
  - **Property 31: CSV export generation**
  - **Validates: Requirements 14.3**

- [x] 15. Enhance upload audio modal functionality
  - Implement file selection in upload modal
  - Add file validation in modal
  - Connect modal confirm button to transcription workflow
  - Add proper modal close handling
  - _Requirements: 14.2, 14.5_

- [x] 16. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
