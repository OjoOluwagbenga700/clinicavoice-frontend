// Role constants for role-based access control
export const ROLES = {
  CLINICIAN: 'clinician',
  PATIENT: 'patient'
};

// Route permissions mapping
export const ROUTE_PERMISSIONS = {
  '/dashboard': [ROLES.CLINICIAN, ROLES.PATIENT],
  '/dashboard/overview': [ROLES.CLINICIAN, ROLES.PATIENT],
  '/dashboard/transcribe': [ROLES.CLINICIAN],
  '/dashboard/templates': [ROLES.CLINICIAN],
  '/dashboard/reports': [ROLES.CLINICIAN, ROLES.PATIENT],
  '/dashboard/settings': [ROLES.CLINICIAN, ROLES.PATIENT]
};
