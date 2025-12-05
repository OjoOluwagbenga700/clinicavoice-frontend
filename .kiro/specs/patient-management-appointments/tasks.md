# Implementation Plan

## Phase 1: Database and Backend Foundation

- [x] 1. Set up DynamoDB tables and infrastructure
  - Create Patients table with GSIs (mrn-index, status-index, lastName-index)
  - Create Appointments table with GSIs (patient-index, date-index, status-index)
  - Create TimeBlocks table
  - Configure table encryption and backup
  - _Requirements: 1.1, 1.5, 4.1_

- [-] 2. Implement Patient CRUD Lambda functions
  - [x] 2.1 Create patients Lambda handler with all CRUD operations
    - GET /patients (list with filtering)
    - GET /patients/{id} (get details)
    - POST /patients (create with MRN generation)
    - PUT /patients/{id} (update)
    - DELETE /patients/{id} (soft delete)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 2.2 Write property test for MRN uniqueness
    - **Property 1: MRN Uniqueness**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.3 Write property test for required field validation
    - **Property 2: Required Field Validation**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.4 Write property test for creation metadata
    - **Property 3: Creation Metadata**
    - **Validates: Requirements 1.3**

- [x] 3. Implement patient search functionality
  - [x] 3.1 Create patient-search Lambda
    - POST /patients/search endpoint
    - Multi-field search (name, MRN, phone, email)
    - Result ranking and sorting
    - _Requirements: 1.5, 7.1, 7.2_
  
  - [ ]* 3.2 Write property test for search completeness
    - **Property 5: Search Completeness**
    - **Validates: Requirements 1.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Patient Portal Authentication

- [x] 5. Implement patient invitation system
  - [x] 5.1 Create patient-invitation Lambda
    - Generate secure activation tokens
    - Send invitation emails via SES
    - Store token with expiration (7 days)
    - _Requirements: 1.1_
  
  - [x] 5.2 Add resend invitation endpoint
    - POST /patients/{id}/resend-invitation
    - Validate patient status
    - Generate new token
    - _Requirements: 1.1_

- [x] 6. Implement patient activation system
  - [x] 6.1 Create patient-activation Lambda
    - POST /patients/activate endpoint
    - Validate activation token
    - Create Cognito user with patient role
    - Link Cognito user to patient record
    - Update account status to active
    - _Requirements: 1.1_
  
  - [x] 6.2 Create PatientActivation frontend page
    - Public route /activate?token=xxx
    - Token validation
    - Password input with strength indicator
    - Password confirmation
    - Terms acceptance
    - Success/error handling
    - _Requirements: 1.1_

- [x] 7. Update patient model and UI for account status
  - [x] 7.1 Add account status fields to patient records
    - Update DynamoDB schema
    - Add cognitoUserId, accountStatus, invitation fields
    - _Requirements: 1.1_
  
  - [x] 7.2 Update PatientCard to show account status
    - Display status badge (pending/active)
    - Add resend invitation button
    - _Requirements: 1.1_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Appointment Management Backend

- [x] 9. Implement Appointment CRUD Lambda functions
  - [x] 9.1 Create appointments Lambda handler
    - GET /appointments (list with filtering)
    - GET /appointments/{id} (get details)
    - POST /appointments (create with conflict check)
    - PUT /appointments/{id} (update/reschedule)
    - POST /appointments/{id}/status (update status)
    - DELETE /appointments/{id} (cancel)
    - _Requirements: 4.1, 4.2, 4.3, 6.1, 6.3, 9.1_
  
  - [ ]* 9.2 Write property test for time slot conflict detection
    - **Property 17: Time Slot Conflict Detection**
    - **Validates: Requirements 4.2, 4.4**
  
  - [ ]* 9.3 Write property test for initial appointment status
    - **Property 18: Initial Appointment Status**
    - **Validates: Requirements 4.3**
  
  - [ ]* 9.4 Write property test for cancellation reason required
    - **Property 22: Cancellation Reason Required**
    - **Validates: Requirements 6.3**

- [x] 10. Implement appointment conflict detection
  - [x] 10.1 Create conflict checking logic
    - Check overlapping appointments by clinician
    - Check blocked time slots
    - Validate duration and time increments
    - _Requirements: 4.2, 4.4, 12.3, 12.4_
  
  - [ ]* 10.2 Write property test for appointment overlap prevention
    - **Property 42: Appointment Overlap Prevention**
    - **Validates: Requirements 12.4**

- [x] 11. Implement time block management
  - [x] 11.1 Add time block CRUD operations
    - Create, read, update, delete time blocks
    - Recurring time block support
    - Validate against existing appointments
    - _Requirements: 19.1, 19.2, 19.4, 19.5_
  
  - [ ]* 11.2 Write property test for time block unavailability
    - **Property 53: Time Block Unavailability**
    - **Validates: Requirements 19.1**

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

 - [x] 13. Create patient list page
  - [x] 13.1 Implement PatientList component
    - Patient table/card view
    - Search bar with real-time filtering
    - Active/inactive toggle
    - Pagination
    - Export to CSV
    - Navigate to patient profile
    - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4, 14.1, 14.2_

- [x] 14. Create patient profile page
  - [x] 14.1 Implement PatientProfile component
    - Patient demographics display
    - Edit patient button
    - Transcription history section
    - Appointment history section
    - Medical history summary
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 11.1_

- [x] 15. Create patient form component
  - [x] 15.1 Implement PatientForm component
    - All demographic fields
    - Contact information fields
    - Field validation
    - Required field indicators
    - Date picker for DOB
    - Save/cancel actions
    - _Requirements: 1.2, 1.3, 1.4, 13.5_

- [x] 16. Create patient selector component
  - [x] 16.1 Implement PatientSelector component
    - Autocomplete dropdown
    - Search by name or MRN
    - Display patient name, MRN, age
    - Quick add new patient option
    - _Requirements: 3.1, 3.4_

- [x] 17. Update Transcribe page with patient selector
  - [x] 17.1 Replace patient name text input with PatientSelector
    - Add PatientSelector component
    - Store patientId instead of patientName
    - Display selected patient info
    - Validate patient selection before save
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [ ]* 17.2 Write property test for patient selection storage
    - **Property 9: Patient Selection Storage**
    - **Validates: Requirements 3.2**

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Frontend - Appointment Management

- [x] 19. Create appointment calendar page
  - [x] 19.1 Implement AppointmentCalendar component
    - Calendar view with day/week/month toggle
    - Display appointments with patient names
    - Color-coded by appointment type
    - Display blocked time slots
    - Click appointment to view details
    - Navigate between dates
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 19.3_

- [x] 20. Create appointment form component
  - [x] 20.1 Implement AppointmentForm component
    - Patient selector
    - Date and time picker
    - Appointment type dropdown
    - Duration selector (15-min increments)
    - Notes field
    - Conflict validation
    - Save/cancel actions
    - _Requirements: 4.1, 10.1, 12.1, 12.2, 12.3_

- [x] 21. Create appointment card component
  - [x] 21.1 Implement AppointmentCard component
    - Display patient name, MRN
    - Display date, time, duration
    - Display appointment type
    - Status indicator
    - Quick action buttons (complete, cancel, reschedule)
    - _Requirements: 5.2, 6.1, 8.2_

- [x] 22. Implement appointment status management
  - [x] 22.1 Add status update functionality
    - Status dropdown/buttons
    - Cancellation reason modal
    - Completion prompt for transcription
    - Status history display
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 23. Implement appointment rescheduling
  - [x] 23.1 Add reschedule functionality
    - Reschedule modal with date/time picker
    - Conflict validation
    - Preserve original creation date
    - Cancel reschedule option
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [ ]* 23.2 Write property test for reschedule creation date preservation
    - **Property 31: Reschedule Creation Date Preservation**
    - **Validates: Requirements 9.3**

- [ ] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 6: Dashboard Integration

- [-] 25. Create today's appointments widget
  - [x] 25.1 Implement TodayAppointments component
    - Display today's appointments
    - Chronological sorting
    - Highlight imminent appointments (within 1 hour)
    - Quick status updates
    - Navigate to appointment details
    - Empty state for no appointments
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 25.2 Write property test for today's appointments sorting
    - **Property 28: Today's Appointments Sorting**
    - **Validates: Requirements 8.1**

- [x] 26. Update dashboard with patient statistics
  - [x] 26.1 Add patient count widget
    - Total active patients
    - New patients this month
    - Patients needing follow-up
    - _Requirements: 18.3_

- [x] 27. Add navigation menu items
  - [x] 27.1 Update Sidebar component
    - Add "Patients" menu item
    - Add "Appointments" menu item
    - Update routing
    - _Requirements: All_

- [ ] 28. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 7: Patient Portal Enhancements

- [x] 29. Update patient dashboard
  - [x] 29.1 Add upcoming appointments section
    - Display patient's upcoming appointments
    - Show date, time, clinician name, type
    - Highlight appointments within 24 hours
    - Empty state with request option
    - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [x] 30. Add patient appointment history
  - [x] 30.1 Implement appointment history view
    - Display past completed appointments
    - Show date, clinician name, status
    - Link to associated transcriptions/reports
    - Chronological order
    - Empty state
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 31. Update patient profile page
  - [x] 31.1 Add patient-specific information
    - View-only demographics
    - Contact information
    - Appointment history
    - Medical records access
    - _Requirements: 17.1_

- [ ] 32. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 8: Advanced Features

- [x] 33. Implement appointment analytics
  - [x] 33.1 Create analytics dashboard
    - Appointment counts by status
    - No-show and cancellation rates
    - Average duration by type
    - Patient volume trends
    - Filterable by date range, type, status
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_
  
  - [ ]* 33.2 Write property test for no-show rate calculation
    - **Property 57: No-Show Rate Calculation**
    - **Validates: Requirements 20.2**

- [x] 34. Implement data export functionality
  - [x] 34.1 Add export features
    - Export patient list to CSV
    - Export appointments to CSV
    - Apply current filters to export
    - Timestamp in filename
    - Exclude sensitive data unless authorized
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [ ]* 34.2 Write property test for export filter application
    - **Property 43: Export Filter Application**
    - **Validates: Requirements 15.3**

- [x] 35. Implement visit frequency tracking
  - [x] 35.1 Add visit frequency features
    - Display last visit date
    - Calculate annual visit count
    - Flag patients needing follow-up (>6 months)
    - Sort by last visit date
    - Include in reports
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_
  
  - [ ]* 35.2 Write property test for follow-up flag
    - **Property 51: Follow-up Flag**
    - **Validates: Requirements 18.3**

- [ ] 36. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 9: Testing and Polish

- [ ]* 37. Comprehensive property-based testing
  - [ ]* 37.1 Write remaining patient management property tests
    - Property 4: Update Timestamp
    - Property 6: Profile Completeness
    - Property 7: Transcription Association
    - Property 13: Age Calculation
    - Property 14: Active Patient Filter
  
  - [ ]* 37.2 Write remaining appointment management property tests
    - Property 19: Calendar Appointment Display
    - Property 21: Status Update
    - Property 23: Status Change Metadata
    - Property 33: Notes Persistence
    - Property 38: Visit Count Accuracy

- [ ]* 38. Integration testing
  - [ ]* 38.1 Test complete patient workflow
    - Create patient → Send invitation → Activate → Login
  
  - [ ]* 38.2 Test complete appointment workflow
    - Create patient → Schedule appointment → Update status → Create transcription
  
  - [ ]* 38.3 Test patient portal workflow
    - Patient login → View appointments → View history → View reports

- [x] 39. UI/UX polish
  - [x] 39.1 Add loading states and error handling
    - Loading spinners
    - Error messages
    - Empty states
    - Success notifications
  
  - [x] 39.2 Responsive design verification
    - Test on mobile devices
    - Test on tablets
    - Test on desktop
  
  - [x] 39.3 Accessibility improvements
    - Keyboard navigation
    - Screen reader support
    - ARIA labels
    - Color contrast

- [-] 40. Documentation
  - [x] 40.1 Create user documentation
    - Patient management guide
    - Appointment scheduling guide
    - Patient portal guide
  
  - [x] 40.2 Create developer documentation
    - API documentation
    - Database schema
    - Component documentation

- [ ] 41. Final Checkpoint - Production readiness
  - Ensure all tests pass, ask the user if questions arise.
 