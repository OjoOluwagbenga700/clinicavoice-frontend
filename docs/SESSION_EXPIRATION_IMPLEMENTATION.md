# Session Expiration Handling Implementation

## Task 11 - Implementation Summary

This document summarizes the implementation of session expiration handling for the ClinicaVoice platform.

## Requirements Addressed

- **Requirement 2.5**: WHEN a user logs out, THEN the System SHALL clear the authentication token and redirect to the home page
- **Requirement 15.3**: WHEN a user session expires, THEN the System SHALL require re-authentication before accessing protected resources
- **Requirement 15.4**: WHEN API requests are made, THEN the System SHALL include authentication tokens in request headers

## Implementation Details

### 1. Session Expiration Detection (`src/utils/auth.js`)

Added three new functions to handle session management:

#### `isSessionValid()`
- Checks if the current session is valid and not expired
- Uses AWS Amplify's `fetchAuthSession()` to get token information
- Validates token expiration by comparing token's `exp` claim with current time
- Returns `true` if session is valid, `false` if expired or invalid

#### `getAuthToken()`
- Retrieves the JWT ID token for API requests
- Uses AWS Amplify's `fetchAuthSession()` to get tokens
- Returns the ID token as a string or `null` if not authenticated
- Used by API service to add authentication headers

### 2. Automatic Redirect on Session Expiration (`src/components/ProtectedRoute.jsx`)

Enhanced the ProtectedRoute component to:

- Check session validity on component mount using `isSessionValid()`
- Periodically check session every 60 seconds using `setInterval`
- Clear session storage when session expires
- Redirect to login page with session expiration state
- Pass location state to allow redirect back to original page after re-authentication

### 3. Authentication Headers for API Requests (`src/services/api.js`)

Created authenticated API wrapper functions:

#### `getAuthHeaders()`
- Private helper function that retrieves auth token
- Creates headers object with `Authorization: Bearer <token>`
- Includes `Content-Type: application/json`

#### API Methods
- `apiGet(path)` - Authenticated GET requests
- `apiPost(path, body)` - Authenticated POST requests
- `apiPut(path, body)` - Authenticated PUT requests
- `apiDelete(path)` - Authenticated DELETE requests

All methods:
- Automatically include authentication headers
- Use AWS Amplify's API module (`get`, `post`, `put`, `del`)
- Target the configured `ClinicaVoiceAPI` endpoint
- Handle errors and log them appropriately

### 4. Clear Session Storage on Logout (`src/components/Header.jsx`)

Updated the `handleLogout()` function to:

- Call AWS Amplify's `signOut()` to end the session
- Clear all session storage using `sessionStorage.clear()`
- Clear session storage even if `signOut()` fails (error handling)
- Update UI state and redirect to home page

### 5. Session Expiration User Feedback (`src/pages/Login.jsx`)

Enhanced the Login component to:

- Check for session expiration state from navigation
- Display a warning alert when redirected due to session expiration
- Show message: "Your session has expired. Please log in again."
- Redirect user back to the page they were trying to access after successful login
- Clear session expiration message when user attempts new login

## Code Changes Summary

### Files Modified

1. **src/utils/auth.js**
   - Added `isSessionValid()` function
   - Added `getAuthToken()` function
   - Imported `fetchAuthSession` from aws-amplify/auth

2. **src/components/ProtectedRoute.jsx**
   - Added session expiration checking with periodic validation
   - Added state management for session expiration
   - Added automatic redirect on expired session
   - Imported `isSessionValid` from utils/auth

3. **src/services/api.js**
   - Added `getAuthHeaders()` helper function
   - Added `apiGet()`, `apiPost()`, `apiPut()`, `apiDelete()` functions
   - Imported API methods from aws-amplify/api
   - Imported `getAuthToken` from utils/auth

4. **src/components/Header.jsx**
   - Updated `handleLogout()` to clear session storage
   - Added error handling to ensure session storage is cleared

5. **src/pages/Login.jsx**
   - Added session expiration message display
   - Added redirect to original page after login
   - Imported `useLocation` hook
   - Removed commented code

## Testing Verification

The implementation can be verified by:

1. **Session Expiration Detection**
   - Log in to the application
   - Wait for token to expire (or manually manipulate token expiration)
   - Verify automatic redirect to login page
   - Verify session expiration message is displayed

2. **Logout Session Clearing**
   - Log in to the application
   - Check session storage (should contain `clinica_token`)
   - Click logout
   - Verify session storage is cleared
   - Verify redirect to home page

3. **API Authentication Headers**
   - Log in to the application
   - Make an API request (e.g., load dashboard data)
   - Verify request includes `Authorization: Bearer <token>` header
   - Verify token is the current user's ID token

4. **Protected Route Access**
   - Try to access `/dashboard` without authentication
   - Verify redirect to login page
   - Log in successfully
   - Verify redirect back to dashboard

## Compliance with Requirements

✅ **Requirement 2.5**: Session storage is cleared on logout via `sessionStorage.clear()`

✅ **Requirement 15.3**: Session expiration is detected and requires re-authentication via `isSessionValid()` and periodic checking in ProtectedRoute

✅ **Requirement 15.4**: Authentication tokens are included in API request headers via `getAuthHeaders()` and authenticated API methods

## Build Status

✅ Application builds successfully with no errors
✅ No TypeScript/ESLint diagnostics errors
✅ All imports resolved correctly
