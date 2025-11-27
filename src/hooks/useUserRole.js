import { useState, useEffect } from 'react';
import { getUserType, getCurrentUserInfo } from '../utils/auth';
import { ROLES } from '../config/roles';

/**
 * Custom hook for accessing the current user's role
 * @returns {Object} Object containing userRole, userInfo, loading state, and error
 */
export function useUserRole() {
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserRole() {
      try {
        setLoading(true);
        setError(null);

        // Fetch user type and full user info
        const [role, info] = await Promise.all([
          getUserType(),
          getCurrentUserInfo()
        ]);

        if (isMounted) {
          setUserRole(role);
          setUserInfo(info);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        if (isMounted) {
          setError(err);
          setUserRole(null);
          setUserInfo(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUserRole();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check (e.g., ROLES.CLINICIAN)
   * @returns {boolean} True if user has the role
   */
  const hasRole = (role) => {
    return userRole === role;
  };

  /**
   * Check if user is a clinician
   * @returns {boolean} True if user is a clinician
   */
  const isClinician = () => {
    return userRole === ROLES.CLINICIAN;
  };

  /**
   * Check if user is a patient
   * @returns {boolean} True if user is a patient
   */
  const isPatient = () => {
    return userRole === ROLES.PATIENT;
  };

  return {
    userRole,
    userInfo,
    loading,
    error,
    hasRole,
    isClinician,
    isPatient
  };
}
