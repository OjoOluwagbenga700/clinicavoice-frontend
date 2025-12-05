import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Grid,
  Button,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  CalendarMonth,
  ViewWeek,
  ViewDay,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isSameDay } from 'date-fns';
import { apiGet } from '../../services/api';
import RescheduleDialog from '../../components/RescheduleDialog';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorDisplay from '../../components/ErrorDisplay';
import EmptyState from '../../components/EmptyState';
import Notification from '../../components/Notification';
import { exportAppointmentsToCSV } from '../../utils/csvExport';

/**
 * AppointmentCalendar Component
 * Displays appointments in calendar view with day/week/month toggle
 * Requirements: 5.1, 5.2, 5.3, 5.5, 19.3
 */
export default function Appointments() {
  const [view, setView] = useState('week'); // 'day', 'week', 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] = useState(null);

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Appointment type colors (Requirement 5.2 - color-coded by type)
  const appointmentTypeColors = {
    consultation: '#2196F3', // Blue
    'follow-up': '#4CAF50', // Green
    procedure: '#FF9800', // Orange
    urgent: '#F44336', // Red
  };

  // Fetch appointments and time blocks
  useEffect(() => {
    fetchData();
  }, [currentDate, view]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on view
      const { startDate, endDate } = getDateRange();

      // Fetch appointments
      const appointmentsResponse = await apiGet(
        `/appointments?startDate=${startDate}&endDate=${endDate}`
      );
      setAppointments(appointmentsResponse.appointments || []);

      // Fetch time blocks
      const timeBlocksResponse = await apiGet(
        `/time-blocks?startDate=${startDate}&endDate=${endDate}`
      );
      setTimeBlocks(timeBlocksResponse.timeBlocks || []);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError('Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get date range based on current view
  const getDateRange = () => {
    let startDate, endDate;

    if (view === 'day') {
      startDate = format(currentDate, 'yyyy-MM-dd');
      endDate = format(currentDate, 'yyyy-MM-dd');
    } else if (view === 'week') {
      startDate = format(startOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      endDate = format(endOfWeek(currentDate, { weekStartsOn: 0 }), 'yyyy-MM-dd');
    } else {
      // month
      startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
    }

    return { startDate, endDate };
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, -1));
    } else {
      setCurrentDate(addMonths(currentDate, -1));
    }
  };

  const handleNext = () => {
    if (view === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  // Handle appointment click (Requirement 5.3)
  const handleAppointmentClick = (appointment) => {
    setSelectedAppointment(appointment);
  };

  // Handle reschedule request
  const handleRescheduleRequest = (appointment) => {
    setAppointmentToReschedule(appointment);
    setRescheduleDialogOpen(true);
  };

  // Handle successful reschedule
  const handleRescheduleSuccess = () => {
    setRescheduleDialogOpen(false);
    setAppointmentToReschedule(null);
    // Show success notification
    setNotification({
      open: true,
      message: 'Appointment rescheduled successfully!',
      severity: 'success'
    });
    // Refresh appointments data
    fetchData();
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Get display title based on view
  const getDisplayTitle = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      const end = endOfWeek(currentDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  // Handle export to CSV (Requirements 15.2, 15.3, 15.4, 15.5)
  const handleExportCSV = () => {
    // Get date range description for filename
    const { startDate, endDate } = getDateRange();
    const dateRange = `${startDate}_to_${endDate}`;
    
    // Export appointments with current filters applied (Requirement 15.3)
    exportAppointmentsToCSV(appointments, {
      dateRange,
      includeNotes: false // Exclude sensitive data unless authorized (Requirement 15.5)
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
        mb={3}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            color: "#2E3A59", 
            fontWeight: 600,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}
        >
          Appointments Calendar
        </Typography>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportCSV}
          disabled={appointments.length === 0}
          size={{ xs: 'small', sm: 'medium' }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Calendar Controls */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 2,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Navigation */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'space-between', md: 'flex-start' }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton onClick={handlePrevious} size="small" aria-label="Previous period">
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={handleToday} size="small" aria-label="Go to today">
                <Today />
              </IconButton>
              <IconButton onClick={handleNext} size="small" aria-label="Next period">
                <ChevronRight />
              </IconButton>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                ml: { xs: 0, sm: 2 }, 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                textAlign: { xs: 'right', md: 'left' }
              }}
            >
              {getDisplayTitle()}
            </Typography>
          </Box>

          {/* View Toggle (Requirement 5.1) */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
            fullWidth={{ xs: true, md: false }}
            aria-label="Calendar view"
          >
            <ToggleButton value="day" aria-label="Day view">
              <ViewDay sx={{ mr: { xs: 0, sm: 0.5 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Day</Box>
            </ToggleButton>
            <ToggleButton value="week" aria-label="Week view">
              <ViewWeek sx={{ mr: { xs: 0, sm: 0.5 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Week</Box>
            </ToggleButton>
            <ToggleButton value="month" aria-label="Month view">
              <CalendarMonth sx={{ mr: { xs: 0, sm: 0.5 } }} />
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Month</Box>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Loading State */}
      {loading ? (
        <LoadingSpinner message="Loading appointments..." />
      ) : error ? (
        /* Error State */
        <ErrorDisplay 
          message={error}
          onRetry={fetchData}
        />
      ) : (
        <>
          {/* Calendar View */}
          {view === 'day' && (
            <DayView
              date={currentDate}
              appointments={appointments}
              timeBlocks={timeBlocks}
              onAppointmentClick={handleAppointmentClick}
              onReschedule={handleRescheduleRequest}
              appointmentTypeColors={appointmentTypeColors}
            />
          )}
          {view === 'week' && (
            <WeekView
              currentDate={currentDate}
              appointments={appointments}
              timeBlocks={timeBlocks}
              onAppointmentClick={handleAppointmentClick}
              onReschedule={handleRescheduleRequest}
              appointmentTypeColors={appointmentTypeColors}
            />
          )}
          {view === 'month' && (
            <MonthView
              currentDate={currentDate}
              appointments={appointments}
              timeBlocks={timeBlocks}
              onAppointmentClick={handleAppointmentClick}
              onReschedule={handleRescheduleRequest}
              appointmentTypeColors={appointmentTypeColors}
            />
          )}

          {/* Appointment Details Panel */}
          {selectedAppointment && (
            <AppointmentDetailsPanel
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
              onReschedule={handleRescheduleRequest}
            />
          )}

          {/* Reschedule Dialog */}
          <RescheduleDialog
            open={rescheduleDialogOpen}
            onClose={() => {
              setRescheduleDialogOpen(false);
              setAppointmentToReschedule(null);
            }}
            appointment={appointmentToReschedule}
            onSuccess={handleRescheduleSuccess}
          />

          {/* Success Notification */}
          <Notification
            open={notification.open}
            onClose={handleNotificationClose}
            message={notification.message}
            severity={notification.severity}
          />
        </>
      )}
    </Box>
  );
}

/**
 * Day View Component
 * Shows appointments for a single day in hourly slots
 */
function DayView({ date, appointments, timeBlocks, onAppointmentClick, onReschedule, appointmentTypeColors }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dateStr = format(date, 'yyyy-MM-dd');

  // Filter appointments for this day
  const dayAppointments = appointments.filter(apt => apt.date === dateStr);
  const dayTimeBlocks = timeBlocks.filter(block => block.date === dateStr);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
        {hours.map(hour => (
          <Box
            key={hour}
            sx={{
              display: 'flex',
              borderBottom: '1px solid #e0e0e0',
              minHeight: 60,
              '&:hover': { backgroundColor: '#f5f5f5' },
            }}
          >
            {/* Time Label */}
            <Box sx={{ width: 80, p: 1, borderRight: '1px solid #e0e0e0', flexShrink: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </Typography>
            </Box>

            {/* Appointments and Time Blocks */}
            <Box sx={{ flex: 1, p: 1, position: 'relative' }}>
              {/* Render time blocks */}
              {dayTimeBlocks
                .filter(block => {
                  const [startHour] = block.startTime.split(':').map(Number);
                  return startHour === hour;
                })
                .map(block => (
                  <TimeBlockCard key={block.id} timeBlock={block} />
                ))}

              {/* Render appointments */}
              {dayAppointments
                .filter(apt => {
                  const [aptHour] = apt.time.split(':').map(Number);
                  return aptHour === hour;
                })
                .map(apt => (
                  <AppointmentCard
                    key={apt.id}
                    appointment={apt}
                    onClick={() => onAppointmentClick(apt)}
                    onReschedule={onReschedule}
                    color={appointmentTypeColors[apt.type]}
                  />
                ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

/**
 * Week View Component
 * Shows appointments for a week in a grid
 */
function WeekView({ currentDate, appointments, timeBlocks, onAppointmentClick, onReschedule, appointmentTypeColors }) {
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Paper sx={{ p: 2, overflowX: 'auto' }}>
      <Grid container spacing={1}>
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointments.filter(apt => apt.date === dateStr);
          const dayTimeBlocks = timeBlocks.filter(block => block.date === dateStr);
          const isToday = isSameDay(day, new Date());

          return (
            <Grid item xs={12} sm={6} md key={dateStr}>
              <Paper
                elevation={isToday ? 3 : 1}
                sx={{
                  p: 1.5,
                  minHeight: 400,
                  backgroundColor: isToday ? '#f0f7ff' : 'white',
                  border: isToday ? '2px solid #2196F3' : 'none',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: isToday ? '#2196F3' : 'text.primary',
                  }}
                >
                  {format(day, 'EEE, MMM d')}
                </Typography>

                {/* Time Blocks */}
                {dayTimeBlocks.map(block => (
                  <TimeBlockCard key={block.id} timeBlock={block} compact />
                ))}

                {/* Appointments */}
                {dayAppointments.length > 0 ? (
                  dayAppointments.map(apt => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      onClick={() => onAppointmentClick(apt)}
                      onReschedule={onReschedule}
                      color={appointmentTypeColors[apt.type]}
                      compact
                    />
                  ))
                ) : dayTimeBlocks.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic', textAlign: 'center' }}>
                    No appointments
                  </Typography>
                ) : null}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}

/**
 * Month View Component
 * Shows appointments for a month in a calendar grid
 */
function MonthView({ currentDate, appointments, timeBlocks, onAppointmentClick, onReschedule, appointmentTypeColors }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Generate all days in the calendar view
  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Group days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <Paper sx={{ p: 2 }}>
      {/* Day Headers */}
      <Grid container spacing={1} sx={{ mb: 1 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <Grid item xs key={dayName}>
            <Typography variant="subtitle2" align="center" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {dayName}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <Grid container spacing={1} key={weekIndex} sx={{ mb: 1 }}>
          {week.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppointments = appointments.filter(apt => apt.date === dateStr);
            const dayTimeBlocks = timeBlocks.filter(block => block.date === dateStr);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = day >= monthStart && day <= monthEnd;

            return (
              <Grid item xs key={dateStr}>
                <Paper
                  elevation={isToday ? 2 : 0}
                  sx={{
                    p: 1,
                    minHeight: 100,
                    backgroundColor: isToday ? '#f0f7ff' : isCurrentMonth ? 'white' : '#fafafa',
                    border: isToday ? '2px solid #2196F3' : '1px solid #e0e0e0',
                    opacity: isCurrentMonth ? 1 : 0.6,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isToday ? 600 : 400,
                      color: isToday ? '#2196F3' : 'text.primary',
                      mb: 0.5,
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>

                  {/* Time Blocks Indicator */}
                  {dayTimeBlocks.length > 0 && (
                    <Chip
                      label="Blocked"
                      size="small"
                      sx={{
                        height: 16,
                        fontSize: '0.65rem',
                        backgroundColor: '#9e9e9e',
                        color: 'white',
                        mb: 0.5,
                      }}
                    />
                  )}

                  {/* Appointments */}
                  {dayAppointments.slice(0, 3).map(apt => (
                    <Tooltip key={apt.id} title={`${apt.time} - ${apt.patientId}`} arrow>
                      <Box
                        onClick={() => onAppointmentClick(apt)}
                        sx={{
                          p: 0.5,
                          mb: 0.5,
                          backgroundColor: appointmentTypeColors[apt.type],
                          color: 'white',
                          borderRadius: 1,
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        {apt.time}
                      </Box>
                    </Tooltip>
                  ))}

                  {/* More indicator */}
                  {dayAppointments.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayAppointments.length - 3} more
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ))}
    </Paper>
  );
}

/**
 * Appointment Card Component
 * Displays appointment information (Requirement 5.2)
 */
function AppointmentCard({ appointment, onClick, color, compact = false }) {
  const ariaLabel = `Appointment at ${appointment.time} for ${appointment.duration} minutes, Patient ID: ${appointment.patientId}, Type: ${appointment.type}, Status: ${appointment.status}`;
  
  return (
    <Card
      onClick={onClick}
      sx={{
        mb: 1,
        cursor: 'pointer',
        borderLeft: `4px solid ${color}`,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.2s',
      }}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent sx={{ p: compact ? 1 : 1.5, '&:last-child': { pb: compact ? 1 : 1.5 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {appointment.time} ({appointment.duration} min)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Patient ID: {appointment.patientId}
        </Typography>
        <Chip
          label={appointment.type}
          size="small"
          sx={{
            backgroundColor: color,
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
        <Chip
          label={appointment.status}
          size="small"
          sx={{
            ml: 0.5,
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Time Block Card Component
 * Displays blocked time slots (Requirement 19.3)
 */
function TimeBlockCard({ timeBlock, compact = false }) {
  return (
    <Card
      sx={{
        mb: 1,
        backgroundColor: '#f5f5f5',
        borderLeft: '4px solid #9e9e9e',
      }}
    >
      <CardContent sx={{ p: compact ? 1 : 1.5, '&:last-child': { pb: compact ? 1 : 1.5 } }}>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          🚫 {timeBlock.startTime} - {timeBlock.endTime}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {timeBlock.reason}
        </Typography>
        <Chip
          label={timeBlock.type}
          size="small"
          sx={{
            mt: 0.5,
            backgroundColor: '#9e9e9e',
            color: 'white',
            fontSize: '0.7rem',
            height: 20,
          }}
        />
      </CardContent>
    </Card>
  );
}

/**
 * Appointment Details Panel Component
 * Shows detailed appointment information when clicked (Requirement 5.3)
 */
function AppointmentDetailsPanel({ appointment, onClose, onReschedule }) {
  const canReschedule = appointment.status === 'scheduled' || appointment.status === 'confirmed';

  return (
    <Paper
      sx={{
        position: 'fixed',
        right: { xs: 0, sm: 20 },
        top: { xs: 0, sm: 100 },
        bottom: { xs: 0, sm: 'auto' },
        width: { xs: '100%', sm: 350 },
        maxHeight: { xs: '100vh', sm: 'calc(100vh - 120px)' },
        overflowY: 'auto',
        p: { xs: 2, sm: 3 },
        boxShadow: 6,
        zIndex: 1000,
        borderRadius: { xs: 0, sm: 1 },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Appointment Details
        </Typography>
        <IconButton size="small" onClick={onClose}>
          ✕
        </IconButton>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Date & Time
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 500 }}>
          {appointment.date} at {appointment.time}
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Duration
        </Typography>
        <Typography variant="body1">{appointment.duration} minutes</Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Patient
        </Typography>
        <Typography variant="body1">
          {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : appointment.patientId}
        </Typography>
        {appointment.patient && (
          <Typography variant="body2" color="text.secondary">
            MRN: {appointment.patient.mrn}
          </Typography>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Type
        </Typography>
        <Chip label={appointment.type} size="small" />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Status
        </Typography>
        <Chip label={appointment.status} size="small" color="primary" />
      </Box>

      {appointment.notes && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Notes
          </Typography>
          <Typography variant="body2">{appointment.notes}</Typography>
        </Box>
      )}

      {/* Reschedule Button */}
      {canReschedule && onReschedule && (
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => {
              onReschedule(appointment);
              onClose();
            }}
          >
            Reschedule Appointment
          </Button>
        </Box>
      )}
    </Paper>
  );
}
