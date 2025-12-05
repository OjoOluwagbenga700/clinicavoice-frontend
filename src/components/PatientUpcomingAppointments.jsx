import { useState, useEffect } from 'react';
import { Box, Typography, Card, Chip, Button } from '@mui/material';
import { fetchPatientUpcomingAppointments } from '../services/api';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

/**
 * PatientUpcomingAppointments Component
 * Displays upcoming appointments for patients (Requirements 16.1, 16.2, 16.3, 16.4)
 */
export default function PatientUpcomingAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPatientUpcomingAppointments();
      setAppointments(response.appointments || []);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if appointment is within 24 hours (Requirement 16.3)
   */
  const isWithin24Hours = (date, time) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const hoursDiff = (appointmentDateTime - now) / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  /**
   * Format time for display (convert 24h to 12h format)
   */
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  /**
   * Get appointment type display name
   */
  const getTypeDisplay = (type) => {
    const types = {
      'consultation': 'Consultation',
      'follow-up': 'Follow-up',
      'procedure': 'Procedure',
      'urgent': 'Urgent'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Upcoming Appointments
        </Typography>
        <Typography color="text.secondary">Loading appointments...</Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Upcoming Appointments
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button onClick={loadAppointments} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Upcoming Appointments
      </Typography>

      {appointments.length === 0 ? (
        // Empty state (Requirement 16.4)
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CalendarTodayIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You have no upcoming appointments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Contact your healthcare provider to schedule an appointment
          </Typography>
          <Button variant="outlined" color="primary">
            Request Appointment
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {appointments.map((appointment) => {
            const isImminent = isWithin24Hours(appointment.date, appointment.time);
            
            return (
              <Card
                key={appointment.id}
                sx={{
                  p: 2,
                  border: isImminent ? '2px solid #ff9800' : '1px solid #e0e0e0',
                  backgroundColor: isImminent ? '#fff3e0' : 'white',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {/* Highlight badge for appointments within 24 hours (Requirement 16.3) */}
                {isImminent && (
                  <Chip
                    label="Coming Soon"
                    color="warning"
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}

                {/* Date and Time (Requirement 16.2) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarTodayIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Typography variant="body1" fontWeight={600}>
                    {formatDate(appointment.date)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Typography variant="body1">
                    {formatTime(appointment.time)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ({appointment.duration} minutes)
                  </Typography>
                </Box>

                {/* Clinician Name (Requirement 16.2) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Typography variant="body1">
                    {appointment.clinicianName || 'Your Healthcare Provider'}
                  </Typography>
                </Box>

                {/* Appointment Type (Requirement 16.2) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MedicalServicesIcon sx={{ fontSize: 18, color: '#666' }} />
                  <Chip
                    label={getTypeDisplay(appointment.type)}
                    size="small"
                    color={appointment.type === 'urgent' ? 'error' : 'primary'}
                    variant="outlined"
                  />
                </Box>

                {/* Notes if available */}
                {appointment.notes && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Notes:</strong> {appointment.notes}
                    </Typography>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
