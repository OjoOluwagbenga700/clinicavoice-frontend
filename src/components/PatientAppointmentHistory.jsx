import { useState, useEffect } from 'react';
import { Box, Typography, Card, Chip, Button } from '@mui/material';
import { fetchPatientAppointmentHistory } from '../services/api';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import DescriptionIcon from '@mui/icons-material/Description';
import HistoryIcon from '@mui/icons-material/History';

/**
 * PatientAppointmentHistory Component
 * Displays past completed appointments for patients (Requirements 17.1, 17.2, 17.3, 17.4, 17.5)
 */
export default function PatientAppointmentHistory() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppointmentHistory();
  }, []);

  const loadAppointmentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchPatientAppointmentHistory();
      setAppointments(response.appointments || []);
    } catch (err) {
      console.error('Failed to load appointment history:', err);
      setError('Failed to load appointment history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Format date for display (Requirement 17.2)
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
          Appointment History
        </Typography>
        <Typography color="text.secondary">Loading appointment history...</Typography>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Appointment History
        </Typography>
        <Typography color="error">{error}</Typography>
        <Button onClick={loadAppointmentHistory} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Appointment History
      </Typography>

      {appointments.length === 0 ? (
        // Empty state (Requirement 17.5)
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <HistoryIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No appointment history available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your past appointments will appear here
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Chronological order - most recent first (Requirement 17.1) */}
          {appointments.map((appointment) => (
            <Card
              key={appointment.id}
              sx={{
                p: 2,
                border: '1px solid #e0e0e0',
                backgroundColor: 'white',
                transition: 'all 0.2s',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {/* Date (Requirement 17.2) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body1" fontWeight={600}>
                  {formatDate(appointment.date)}
                </Typography>
              </Box>

              {/* Clinician Name (Requirement 17.2) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PersonIcon sx={{ fontSize: 18, color: '#666' }} />
                <Typography variant="body1">
                  {appointment.clinicianName || 'Your Healthcare Provider'}
                </Typography>
              </Box>

              {/* Appointment Type */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MedicalServicesIcon sx={{ fontSize: 18, color: '#666' }} />
                <Chip
                  label={getTypeDisplay(appointment.type)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Box>

              {/* Status - Only completed appointments shown (Requirements 17.2, 17.4) */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip
                  label="Completed"
                  size="small"
                  color="success"
                />
              </Box>

              {/* Link to associated transcription/report (Requirement 17.3) */}
              {appointment.transcriptionId && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DescriptionIcon />}
                    href={`/dashboard/reports?id=${appointment.transcriptionId}`}
                    sx={{ textTransform: 'none' }}
                  >
                    View Associated Report
                  </Button>
                </Box>
              )}

              {/* Notes if available */}
              {appointment.notes && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Notes:</strong> {appointment.notes}
                  </Typography>
                </Box>
              )}
            </Card>
          ))}
        </Box>
      )}
    </Card>
  );
}
