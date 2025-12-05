import React, { useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Cake as CakeIcon,
  Send as SendIcon
} from "@mui/icons-material";
import { apiPost } from "../services/api";

/**
 * PatientCard Component
 * Displays patient information with account status and resend invitation functionality
 * 
 * @param {Object} patient - Patient object with demographics and account status
 * @param {Function} onClick - Callback when card is clicked
 * @param {Function} onInvitationSent - Callback after invitation is resent
 */
export default function PatientCard({ patient, onClick, onInvitationSent }) {
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const [invitationError, setInvitationError] = useState(null);
  
  // Generate accessible label for the card
  const cardAriaLabel = `Patient: ${patient.firstName} ${patient.lastName}, MRN: ${patient.mrn}, Age: ${calculateAge(patient.dateOfBirth)}, Status: ${patient.accountStatus || patient.status}`;

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // Get account status badge color and label
  const getAccountStatusBadge = () => {
    const status = patient.accountStatus || 'pending';
    
    switch (status) {
      case 'active':
        return {
          label: 'Active',
          color: 'success'
        };
      case 'pending':
        return {
          label: 'Pending',
          color: 'warning'
        };
      case 'inactive':
        return {
          label: 'Inactive',
          color: 'default'
        };
      default:
        return {
          label: status,
          color: 'default'
        };
    }
  };

  // Handle resend invitation
  const handleResendInvitation = async (e) => {
    e.stopPropagation(); // Prevent card click
    
    if (!patient.email) {
      setInvitationError('Patient does not have an email address');
      return;
    }

    setSendingInvitation(true);
    setInvitationError(null);

    try {
      await apiPost(`/patients/${patient.id}/resend-invitation`, {});
      
      // Call callback if provided
      if (onInvitationSent) {
        onInvitationSent(patient.id);
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      setInvitationError('Failed to send invitation. Please try again.');
    } finally {
      setSendingInvitation(false);
    }
  };

  const age = calculateAge(patient.dateOfBirth);
  const accountStatus = getAccountStatusBadge();
  const showResendButton = patient.accountStatus === 'pending' && patient.email;

  return (
    <Card 
      elevation={1} 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          elevation: 3,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={cardAriaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent>
        {/* Header with name and status */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon color="primary" />
            <Typography variant="h6" sx={{ color: "#2E3A59" }}>
              {patient.firstName} {patient.lastName}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Chip 
              label={accountStatus.label} 
              color={accountStatus.color}
              size="small"
            />
            {showResendButton && (
              <Tooltip title={invitationError || "Resend invitation email"}>
                <span>
                  <IconButton
                    size="small"
                    onClick={handleResendInvitation}
                    disabled={sendingInvitation}
                    color="primary"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'primary.light'
                      }
                    }}
                  >
                    {sendingInvitation ? (
                      <CircularProgress size={20} />
                    ) : (
                      <SendIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Patient details */}
        <Box display="flex" flexDirection="column" gap={1}>
          {/* MRN */}
          <Typography variant="body2" color="text.secondary">
            <strong>MRN:</strong> {patient.mrn}
          </Typography>

          {/* Age and Gender */}
          <Box display="flex" alignItems="center" gap={2}>
            {age !== null && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <CakeIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {age} years old
                </Typography>
              </Box>
            )}
            {patient.gender && (
              <Typography variant="body2" color="text.secondary">
                {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
              </Typography>
            )}
          </Box>

          {/* Contact Information */}
          <Box display="flex" flexDirection="column" gap={0.5}>
            {patient.phone && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {patient.phone}
                </Typography>
              </Box>
            )}
            {patient.email && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {patient.email}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Visit Frequency Information */}
          {patient.lastVisitDate && (
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Visit:</strong> {new Date(patient.lastVisitDate).toLocaleDateString()}
              </Typography>
              {patient.annualVisitCount !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Visits (Past Year):</strong> {patient.annualVisitCount}
                </Typography>
              )}
            </Box>
          )}

          {/* Follow-up flag */}
          {patient.needsFollowUp && (
            <Chip 
              label="Needs Follow-up" 
              color="warning"
              size="small"
              sx={{ width: 'fit-content' }}
            />
          )}

          {/* Status indicator */}
          {patient.status === 'inactive' && (
            <Chip 
              label="Inactive Patient" 
              color="default"
              size="small"
              sx={{ width: 'fit-content' }}
            />
          )}
        </Box>

        {/* Error message */}
        {invitationError && (
          <Typography 
            variant="caption" 
            color="error" 
            sx={{ mt: 1, display: 'block' }}
          >
            {invitationError}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
