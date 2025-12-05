import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Chip,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  Person as PersonIcon,
  CheckCircle as CompleteIcon,
  NavigateNext as NavigateIcon,
  EventAvailable as ConfirmIcon,
  EventBusy as NoShowIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

/**
 * TodayAppointments Component
 * Displays today's appointments on the dashboard
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 * 
 * Features:
 * - Display today's appointments in chronological order (Requirement 8.1)
 * - Show patient name, appointment time, and appointment type (Requirement 8.2)
 * - Highlight imminent appointments (within 1 hour) (Requirement 8.3)
 * - Navigate to appointment details (Requirement 8.4)
 * - Empty state for no appointments (Requirement 8.5)
 */
export default function TodayAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState({});

  useEffect(() => {
    fetchTodayAppointments();
    
    // Refresh every 5 minutes to keep imminent appointments updated
    const interval = setInterval(fetchTodayAppointments, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetches today's appointments
   * Requirement 8.1: Display today's appointments in chronological order
   */
  const fetchTodayAppointments = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiGet(`/appointments?startDate=${today}&endDate=${today}`);
      
      // Sort appointments chronologically by time (Requirement 8.1)
      const sortedAppointments = (response.appointments || []).sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
      
      setAppointments(sortedAppointments);
    } catch (err) {
      console.error('Error fetching today\'s appointments:', err);
      setError('Failed to load today\'s appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Checks if an appointment is imminent (within 1 hour)
   * Requirement 8.3: Highlight imminent appointments
   */
  const isImminentAppointment = (appointment) => {
    const now = new Date();
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const appointmentTime = new Date();
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    const diffInMinutes = (appointmentTime - now) / (1000 * 60);
    
    // Imminent if within next 60 minutes and not in the past
    return diffInMinutes > 0 && diffInMinutes <= 60;
  };

  /**
   * Formats time for display
   * Requirement 8.2: Show appointment time
   */
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Gets color for appointment type
   */
  const getTypeColor = (type) => {
    const colors = {
      consultation: '#2196F3',
      'follow-up': '#4CAF50',
      procedure: '#FF9800',
      urgent: '#F44336',
    };
    return colors[type] || '#757575';
  };

  /**
   * Gets status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'confirmed':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no-show':
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * Handles quick status update
   * Requirement 8.2: Quick status updates
   */
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [appointmentId]: true }));

    try {
      await apiPost(`/appointments/${appointmentId}/status`, {
        status: newStatus,
      });

      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  /**
   * Navigates to appointment details
   * Requirement 8.4: Navigate to appointment details
   */
  const handleViewDetails = (appointmentId) => {
    navigate(`/dashboard/appointments?appointmentId=${appointmentId}`);
  };

  /**
   * Navigates to all appointments
   */
  const handleViewAllAppointments = () => {
    navigate('/dashboard/appointments');
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Today's Appointments
          </Typography>
          <LoadingSpinner message="Loading today's appointments..." fullHeight={false} size={32} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Today's Appointments
          </Typography>
          <Button
            size="small"
            endIcon={<NavigateIcon />}
            onClick={handleViewAllAppointments}
            sx={{ textTransform: 'none' }}
          >
            View All
          </Button>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Appointments List or Empty State */}
        {appointments.length === 0 ? (
          // Empty State (Requirement 8.5)
          <EmptyState
            title="No appointments today"
            message="You have no appointments scheduled for today. Enjoy your day!"
            icon="event"
            fullHeight={false}
          />
        ) : (
          <Box>
            {appointments.map((appointment, index) => {
              const isImminent = isImminentAppointment(appointment);
              const isUpdating = updatingStatus[appointment.id];
              const canQuickUpdate = appointment.status === 'scheduled' || appointment.status === 'confirmed';

              return (
                <React.Fragment key={appointment.id}>
                  {index > 0 && <Divider sx={{ my: 1.5 }} />}
                  
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1,
                      // Highlight imminent appointments (Requirement 8.3)
                      backgroundColor: isImminent ? '#fff3e0' : 'transparent',
                      border: isImminent ? '2px solid #ff9800' : 'none',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: isImminent ? '#ffe0b2' : '#f5f5f5',
                      },
                    }}
                  >
                    {/* Imminent Badge */}
                    {isImminent && (
                      <Chip
                        label="Starting Soon"
                        size="small"
                        color="warning"
                        icon={<TimeIcon />}
                        sx={{ mb: 1, fontWeight: 600 }}
                      />
                    )}

                    {/* Patient Name (Requirement 8.2) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <PersonIcon fontSize="small" color="primary" />
                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#2E3A59' }}>
                        {appointment.patient
                          ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                          : 'Loading...'}
                      </Typography>
                    </Box>

                    {/* Patient MRN */}
                    {appointment.patient && (
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 3.5, mb: 1 }}>
                        MRN: {appointment.patient.mrn}
                      </Typography>
                    )}

                    {/* Time and Type (Requirement 8.2) */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3.5, mb: 1 }}>
                      <TimeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {formatTime(appointment.time)} ({appointment.duration} min)
                      </Typography>
                      <Chip
                        label={appointment.type}
                        size="small"
                        sx={{
                          backgroundColor: getTypeColor(appointment.type),
                          color: 'white',
                          textTransform: 'capitalize',
                          fontWeight: 500,
                          height: 20,
                          fontSize: '0.7rem',
                        }}
                      />
                    </Box>

                    {/* Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3.5, mb: 1 }}>
                      <Chip
                        label={appointment.status}
                        color={getStatusColor(appointment.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>

                    {/* Quick Actions */}
                    {canQuickUpdate && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 1.5, ml: 3.5 }}>
                        <Tooltip title="Mark as confirmed">
                          <span>
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                              disabled={isUpdating || appointment.status === 'confirmed'}
                              sx={{
                                border: '1px solid',
                                borderColor: 'info.main',
                                borderRadius: 1,
                              }}
                            >
                              {isUpdating ? <CircularProgress size={16} /> : <ConfirmIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Mark as completed">
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                              disabled={isUpdating}
                              sx={{
                                border: '1px solid',
                                borderColor: 'success.main',
                                borderRadius: 1,
                              }}
                            >
                              {isUpdating ? <CircularProgress size={16} /> : <CompleteIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Mark as no-show">
                          <span>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleStatusUpdate(appointment.id, 'no-show')}
                              disabled={isUpdating}
                              sx={{
                                border: '1px solid',
                                borderColor: 'warning.main',
                                borderRadius: 1,
                              }}
                            >
                              {isUpdating ? <CircularProgress size={16} /> : <NoShowIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="View details">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(appointment.id)}
                              sx={{
                                border: '1px solid',
                                borderColor: 'action.active',
                                borderRadius: 1,
                              }}
                            >
                              <NavigateIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    )}

                    {/* View Details Button for non-active appointments */}
                    {!canQuickUpdate && (
                      <Box sx={{ mt: 1.5, ml: 3.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<NavigateIcon />}
                          onClick={() => handleViewDetails(appointment.id)}
                          sx={{ textTransform: 'none' }}
                        >
                          View Details
                        </Button>
                      </Box>
                    )}
                  </Box>
                </React.Fragment>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
