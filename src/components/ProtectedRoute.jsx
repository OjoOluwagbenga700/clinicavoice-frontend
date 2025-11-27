import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import { useUserRole } from '../hooks/useUserRole';
import { ROUTE_PERMISSIONS } from '../config/roles';
import { isSessionValid } from '../utils/auth';

/**
 * ProtectedRoute component that checks user authentication and role permissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string[]} props.allowedRoles - Array of roles allowed to access this route
 * @param {string} props.redirectTo - Path to redirect to if unauthorized (default: '/login')
 * @returns {React.ReactNode} Protected content or redirect
 */
export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/login' 
}) {
  const location = useLocation();
  const { userRole, loading, error } = useUserRole();
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check session validity on mount and periodically (Requirement 15.3)
  useEffect(() => {
    const checkSession = async () => {
      const valid = await isSessionValid();
      if (!valid && !loading) {
        setSessionExpired(true);
        // Clear session storage on expiration
        sessionStorage.clear();
      }
    };

    checkSession();

    // Check session every 60 seconds
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F9FAFB'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  // If session expired, redirect to login (Requirement 15.3)
  if (sessionExpired) {
    return <Navigate to={redirectTo} state={{ from: location, sessionExpired: true }} replace />;
  }

  // If there's an error or no user role, redirect to login
  if (error || !userRole) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check if user's role is in the allowed roles list
  const hasPermission = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  // If user doesn't have permission, show access denied
  if (!hasPermission) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#F9FAFB',
          p: 3
        }}
      >
        <Alert 
          severity="error" 
          sx={{ 
            maxWidth: 600,
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You do not have permission to access this page. 
            {userRole === 'patient' 
              ? ' This feature is only available to clinicians.' 
              : ' Please contact your administrator.'}
          </Typography>
        </Alert>
      </Box>
    );
  }

  // User is authenticated and has permission, render children
  return children;
}

// PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  redirectTo: PropTypes.string
};

/**
 * Helper function to get allowed roles for a route path
 * @param {string} path - Route path
 * @returns {string[]} Array of allowed roles
 */
export function getAllowedRolesForRoute(path) {
  return ROUTE_PERMISSIONS[path] || [];
}
