# Requirements Document

## Introduction

ClinicaVoice is an AI-powered clinical transcription and documentation platform designed for Canadian healthcare professionals. The system enables clinicians to dictate patient notes, transcribe audio recordings, manage medical documentation templates, and generate reports. The platform prioritizes security, compliance with Canadian privacy standards, and workflow efficiency to reduce administrative burden and improve patient care quality.

## Glossary

- **System**: The ClinicaVoice web application
- **User**: Any authenticated person using the platform (clinician, patient, or administrator)
- **Clinician**: A healthcare professional who creates and manages clinical documentation
- **Patient**: An individual receiving healthcare services whose information is documented
- **Transcription**: The process of converting audio recordings into text format
- **Template**: A reusable structured document format for clinical notes (e.g., SOAP notes, progress notes)
- **Placeholder**: A variable field in a template that gets replaced with actual patient data (e.g., {{PatientName}})
- **Report**: A saved transcription or clinical note associated with a patient
- **Audio File**: A recorded voice dictation in formats such as webm, mp3, or wav
- **AWS Amplify**: The authentication and cloud storage service used by the System
- **AWS Transcribe**: The AI service that converts audio to text
- **Session**: An authenticated user's active connection to the System
- **Dashboard**: The main authenticated interface showing overview statistics and quick actions

## Requirements

### Requirement 1

**User Story:** As a clinician, I want to register for an account with my credentials and user type, so that I can access the platform securely.

#### Acceptance Criteria

1. WHEN a user submits the registration form with name, email, password, and user type, THEN the System SHALL create a new user account in AWS Amplify
2. WHEN a user account is created, THEN the System SHALL send a confirmation code to the provided email address
3. WHEN a user enters a valid confirmation code, THEN the System SHALL activate the account and redirect to the login page
4. WHEN a user enters an invalid confirmation code, THEN the System SHALL display an error message and maintain the confirmation form state
5. WHERE the user type is "clinician" or "patient", THEN the System SHALL store the user type as a custom attribute in the user profile

### Requirement 2

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my dashboard and clinical tools.

#### Acceptance Criteria

1. WHEN a user submits valid credentials, THEN the System SHALL authenticate the user through AWS Amplify and grant access to the dashboard
2. WHEN a user submits invalid credentials, THEN the System SHALL display an error message without revealing whether the email or password was incorrect
3. WHEN authentication succeeds, THEN the System SHALL store an authentication token in session storage
4. WHEN a user attempts to access protected routes without authentication, THEN the System SHALL redirect to the login page
5. WHEN a user logs out, THEN the System SHALL clear the authentication token and redirect to the home page

### Requirement 3

**User Story:** As a clinician, I want to record audio directly in my browser, so that I can capture patient notes hands-free during consultations.

#### Acceptance Criteria

1. WHEN a clinician clicks the start recording button, THEN the System SHALL request microphone access and begin capturing audio
2. WHILE recording is active, THEN the System SHALL display a visual indicator showing recording status
3. WHEN a clinician clicks the stop recording button, THEN the System SHALL stop capturing audio and create an audio blob in webm format
4. WHEN microphone access is denied, THEN the System SHALL display an error message indicating microphone access was denied
5. WHEN recording stops, THEN the System SHALL store the audio blob in memory for subsequent transcription

### Requirement 4

**User Story:** As a clinician, I want to upload pre-recorded audio files, so that I can transcribe dictations made outside the application.

#### Acceptance Criteria

1. WHEN a clinician selects an audio file through the upload interface, THEN the System SHALL accept files in audio formats including webm, mp3, wav, and m4a
2. WHEN a file is selected, THEN the System SHALL store the file object in memory for transcription
3. WHEN a clinician uploads a file larger than 100MB, THEN the System SHALL display an error message indicating the file size limit
4. WHEN no file is selected and the user attempts transcription, THEN the System SHALL display an error message requesting audio input

### Requirement 5

**User Story:** As a clinician, I want to transcribe recorded or uploaded audio, so that I can convert voice dictations into editable text.

#### Acceptance Criteria

1. WHEN a clinician initiates transcription with an audio file, THEN the System SHALL upload the file to AWS S3 storage with a unique key
2. WHEN the file upload completes, THEN the System SHALL invoke the AWS Transcribe service through API Gateway with the file key
3. WHILE transcription is processing, THEN the System SHALL display a loading indicator and status message
4. WHEN transcription completes successfully, THEN the System SHALL display the transcript text in an editable text field
5. WHEN transcription fails, THEN the System SHALL display an error message and allow the user to retry

### Requirement 6

**User Story:** As a clinician, I want to edit transcribed text, so that I can correct errors and add additional clinical details.

#### Acceptance Criteria

1. WHEN a transcript is displayed, THEN the System SHALL render it in a multi-line text field with a minimum of 8 rows
2. WHEN a clinician modifies the transcript text, THEN the System SHALL update the transcript state in real-time
3. WHEN a clinician saves the transcript, THEN the System SHALL persist the edited text to cloud storage through the API
4. WHEN save succeeds, THEN the System SHALL display a success message
5. WHEN save fails, THEN the System SHALL display an error message and preserve the unsaved changes

### Requirement 7

**User Story:** As a clinician, I want to create and manage medical documentation templates, so that I can standardize my clinical notes and improve efficiency.

#### Acceptance Criteria

1. WHEN a clinician creates a new template, THEN the System SHALL generate a unique template ID and add it to the template list
2. WHEN a clinician edits a template name, THEN the System SHALL update the template name in the template list
3. WHEN a clinician edits template content using the rich text editor, THEN the System SHALL preserve formatting including line breaks and text styling
4. WHEN a clinician saves a template, THEN the System SHALL update the template in the templates array with the current name and content
5. WHEN a clinician deletes a template, THEN the System SHALL remove it from the template list and switch to the first available template

### Requirement 8

**User Story:** As a clinician, I want to insert placeholders into templates, so that I can create dynamic fields that populate with patient data.

#### Acceptance Criteria

1. WHEN a clinician clicks a placeholder button, THEN the System SHALL insert the placeholder text in the format {{PlaceholderName}} at the current cursor position
2. WHEN a template contains placeholders, THEN the System SHALL display them as distinct text patterns in the editor
3. WHERE placeholders include PatientName, Date, Diagnosis, or Medications, THEN the System SHALL provide quick-insert buttons for each
4. WHEN a clinician switches templates, THEN the System SHALL load the template content including all placeholders

### Requirement 9

**User Story:** As a clinician, I want to preview templates with sample data, so that I can verify how the final document will appear.

#### Acceptance Criteria

1. WHEN a template is displayed in preview mode, THEN the System SHALL replace all placeholders with corresponding sample patient data
2. WHEN a placeholder has no matching sample data, THEN the System SHALL leave the placeholder text unchanged
3. WHEN the template content changes, THEN the System SHALL update the preview in real-time
4. WHEN rendering the preview, THEN the System SHALL convert line breaks to HTML break tags for proper formatting

### Requirement 10

**User Story:** As a clinician, I want to view a dashboard overview with key statistics, so that I can monitor my clinical documentation activity.

#### Acceptance Criteria

1. WHEN a clinician accesses the dashboard, THEN the System SHALL display the count of active patients
2. WHEN a clinician accesses the dashboard, THEN the System SHALL display the count of recent transcriptions
3. WHEN a clinician accesses the dashboard, THEN the System SHALL display the count of pending reviews
4. WHEN a clinician accesses the dashboard, THEN the System SHALL display an activity chart showing transcription counts over the last 30 days
5. WHEN dashboard data is loading, THEN the System SHALL display a loading indicator

### Requirement 11

**User Story:** As a clinician, I want to view and search my saved reports, so that I can quickly find patient documentation.

#### Acceptance Criteria

1. WHEN a clinician accesses the reports page, THEN the System SHALL display all saved reports with patient name, date, and summary
2. WHEN a clinician enters text in the search field, THEN the System SHALL filter reports by patient name or summary containing the search text
3. WHEN search results are empty, THEN the System SHALL display a message indicating no reports were found
4. WHEN a clinician clicks on a report, THEN the System SHALL navigate to the transcription page with the report ID as a parameter
5. WHEN a report is opened, THEN the System SHALL load the associated transcription data

### Requirement 12

**User Story:** As a user, I want to use the application in English or French, so that I can work in my preferred language.

#### Acceptance Criteria

1. WHEN a user changes the language setting, THEN the System SHALL update all interface text to the selected language
2. WHEN the application loads, THEN the System SHALL default to English language
3. WHERE the selected language is French, THEN the System SHALL display all navigation, labels, and messages in French
4. WHEN language changes, THEN the System SHALL preserve the current page state and user data
5. WHEN a translation key is missing, THEN the System SHALL fall back to the English translation

### Requirement 13

**User Story:** As a user, I want the application to be responsive across devices, so that I can use it on desktop, tablet, or mobile.

#### Acceptance Criteria

1. WHEN the viewport width is less than 768 pixels, THEN the System SHALL display the mobile layout with stacked components
2. WHEN the viewport width is 768 pixels or greater, THEN the System SHALL display the desktop layout with side-by-side components
3. WHEN a user rotates their device, THEN the System SHALL adjust the layout to match the new orientation
4. WHEN displaying cards in a grid, THEN the System SHALL adjust column count based on viewport width
5. WHEN rendering forms, THEN the System SHALL ensure all input fields are accessible and properly sized for touch interaction

### Requirement 14

**User Story:** As a clinician, I want quick action buttons on the dashboard, so that I can rapidly access common tasks.

#### Acceptance Criteria

1. WHEN a clinician clicks the new transcription button, THEN the System SHALL navigate to the transcription page
2. WHEN a clinician clicks the upload audio button, THEN the System SHALL display a modal with file upload interface
3. WHEN a clinician clicks the export report button, THEN the System SHALL generate a CSV file with transcription data and trigger download
4. WHEN a clinician clicks the edit templates button, THEN the System SHALL navigate to the template builder page
5. WHEN a modal is open, THEN the System SHALL provide cancel and confirm buttons for user control

### Requirement 15

**User Story:** As a system administrator, I want user authentication to be secure and compliant, so that patient data remains protected.

#### Acceptance Criteria

1. WHEN a user creates a password, THEN the System SHALL enforce AWS Amplify password requirements including minimum length and complexity
2. WHEN authentication tokens are stored, THEN the System SHALL use session storage to limit token persistence
3. WHEN a user session expires, THEN the System SHALL require re-authentication before accessing protected resources
4. WHEN API requests are made, THEN the System SHALL include authentication tokens in request headers
5. WHEN authentication fails, THEN the System SHALL not expose sensitive information about the failure reason

### Requirement 16

**User Story:** As a clinician, I want access to transcription, template building, and report management features, so that I can manage clinical documentation efficiently.

#### Acceptance Criteria

1. WHEN a clinician logs in, THEN the System SHALL display the clinician dashboard with transcription, templates, reports, and settings navigation options
2. WHEN a clinician accesses the transcription page, THEN the System SHALL display recording, upload, and transcription controls
3. WHEN a clinician accesses the template builder, THEN the System SHALL display template creation, editing, and management interfaces
4. WHEN a clinician accesses reports, THEN the System SHALL display all reports created by that clinician with search and filter capabilities
5. WHERE the user type is clinician, THEN the System SHALL grant access to all clinical documentation features

### Requirement 17

**User Story:** As a patient, I want access to view my own medical reports and transcriptions, so that I can stay informed about my healthcare documentation.

#### Acceptance Criteria

1. WHEN a patient logs in, THEN the System SHALL display the patient dashboard with view-only access to their personal reports
2. WHEN a patient accesses their reports, THEN the System SHALL display only reports associated with that patient's account
3. WHEN a patient attempts to access transcription creation features, THEN the System SHALL deny access and display an appropriate message
4. WHEN a patient attempts to access template builder features, THEN the System SHALL deny access and display an appropriate message
5. WHERE the user type is patient, THEN the System SHALL restrict access to view-only operations on personal data

### Requirement 18

**User Story:** As a system administrator, I want role-based access control enforced throughout the application, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. WHEN the System authenticates a user, THEN the System SHALL retrieve the user type from the custom user attributes
2. WHEN rendering navigation menus, THEN the System SHALL display only menu items accessible to the user's role
3. WHEN a user attempts to access a route, THEN the System SHALL verify the user's role has permission for that route
4. WHEN a user attempts unauthorized access, THEN the System SHALL redirect to an appropriate page and display an access denied message
5. WHEN API requests are made, THEN the System SHALL validate the user's role on the backend before processing the request

### Requirement 19

**User Story:** As a clinician, I want a dedicated clinician interface with workflow-optimized navigation, so that I can efficiently manage multiple patients and documentation tasks.

#### Acceptance Criteria

1. WHEN a clinician accesses the dashboard, THEN the System SHALL display statistics for active patients, recent transcriptions, and pending reviews
2. WHEN a clinician views the sidebar, THEN the System SHALL display navigation links for Overview, Transcribe, Reports, Templates, and Settings
3. WHEN a clinician accesses quick actions, THEN the System SHALL provide buttons for new transcription, upload audio, export report, and edit templates
4. WHEN a clinician views the activity chart, THEN the System SHALL display transcription trends over the last 30 days
5. WHEN a clinician accesses recent notes, THEN the System SHALL display the most recent transcriptions with status indicators

### Requirement 20

**User Story:** As a patient, I want a simplified patient interface focused on viewing my health information, so that I can easily access my medical documentation without confusion.

#### Acceptance Criteria

1. WHEN a patient accesses the dashboard, THEN the System SHALL display a simplified view showing their personal reports and appointments
2. WHEN a patient views the sidebar, THEN the System SHALL display navigation links for My Reports, My Profile, and Settings
3. WHEN a patient accesses a report, THEN the System SHALL display the report in read-only mode with clear formatting
4. WHEN a patient views their profile, THEN the System SHALL display their personal information and medical history
5. WHEN a patient attempts to modify a report, THEN the System SHALL prevent editing and display a message indicating reports are managed by clinicians
