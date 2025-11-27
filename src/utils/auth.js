import { fetchUserAttributes, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

/**
 * Retrieves the user type from Cognito custom attributes
 * @returns {Promise<string|null>} The user type ('clinician' or 'patient') or null if not found
 */
export async function getUserType() {
  try {
    // First check if user is authenticated
    await getCurrentUser();
    
    // Fetch user attributes from Cognito
    const attributes = await fetchUserAttributes();
    
    // Return the custom user_type attribute
    return attributes['custom:user_type'] || null;
  } catch (error) {
    console.error('Error fetching user type:', error);
    return null;
  }
}

/**
 * Checks if the current session is valid and not expired
 * @returns {Promise<boolean>} True if session is valid, false if expired or invalid
 */
export async function isSessionValid() {
  try {
    const session = await fetchAuthSession();
    
    // Check if tokens exist and are valid
    if (!session.tokens) {
      return false;
    }
    
    // Check if access token is expired
    const accessToken = session.tokens.accessToken;
    if (!accessToken) {
      return false;
    }
    
    // Get expiration time from token payload
    const expirationTime = accessToken.payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    
    // Return true if token is not expired
    return currentTime < expirationTime;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Gets the authentication token for API requests
 * @returns {Promise<string|null>} The JWT token or null if not authenticated
 */
export async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.error('Error fetching auth token:', error);
    return null;
  }
}

/**
 * Checks if the current user is authenticated
 * @returns {Promise<boolean>} True if user is authenticated, false otherwise
 */
export async function isAuthenticated() {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the user has a specific role
 * @param {string} role - The role to check (e.g., ROLES.CLINICIAN)
 * @returns {Promise<boolean>} True if user has the role, false otherwise
 */
export async function hasRole(role) {
  try {
    const userType = await getUserType();
    return userType === role;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Gets the current user's information including role
 * @returns {Promise<Object|null>} User object with id, email, name, and userType
 */
export async function getCurrentUserInfo() {
  try {
    const user = await getCurrentUser();
    const attributes = await fetchUserAttributes();
    
    return {
      id: user.userId,
      username: user.username,
      email: attributes.email,
      name: attributes.name,
      userType: attributes['custom:user_type'] || null
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}
