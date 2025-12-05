import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  EventAvailable,
  EventBusy,
  PersonOff,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { format, subDays, subMonths } from 'date-fns';
import { apiGet } from '../../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * Analytics Dashboard Component
 * Displays appointment analytics and statistics
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */
export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters (Requirement 20.5)
  const [dateRange, setDateRange] = useState('30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
      if (filterType) {
        params.append('type', filterType);
      }
      if (filterStatus) {
        params.append('status', filterStatus);
      }

      const queryString = params.toString();
      const response = await apiGet(`/appointments/analytics${queryString ? `?${queryString}` : ''}`);
      setAnalytics(response);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    const today = new Date();
    
    switch (range) {
      case '7days':
        setStartDate(format(subDays(today, 7), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '30days':
        setStartDate(format(subDays(today, 30), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '90days':
        setStartDate(format(subDays(today, 90), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '6months':
        setStartDate(format(subMonths(today, 6), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case '1year':
        setStartDate(format(subMonths(today, 12), 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'all':
        setStartDate('');
        setEndDate('');
        break;
      default:
        break;
    }
  };

  const handleApplyFilters = () => {
    fetchAnalytics();
  };

  const handleResetFilters = () => {
    setDateRange('30days');
    setStartDate(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    setEndDate(format(new Date(), 'yyyy-MM-dd'));
    setFilterType('');
    setFilterStatus('');
  };

  // Colors for charts
  const statusColors = {
    scheduled: '#2196F3',
    confirmed: '#4CAF50',
    completed: '#8BC34A',
    cancelled: '#FF9800',
    'no-show': '#F44336',
  };

  const typeColors = {
    consultation: '#2196F3',
    'follow-up': '#4CAF50',
    procedure: '#FF9800',
    urgent: '#F44336',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  if (!analytics) {
    return null;
  }

  // Prepare data for charts
  const statusData = Object.entries(analytics.statusCounts).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: statusColors[status],
  }));

  const durationData = Object.entries(analytics.averageDurationByType).map(([type, duration]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' '),
    duration,
    color: typeColors[type],
  }));

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2E3A59' }}>
        Appointment Analytics
      </Typography>

      {/* Filters Section (Requirement 20.5) */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Filters
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Date Range"
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              size="small"
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="6months">Last 6 Months</MenuItem>
              <MenuItem value="1year">Last Year</MenuItem>
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </TextField>
          </Grid>

          {dateRange === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              label="Appointment Type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="consultation">Consultation</MenuItem>
              <MenuItem value="follow-up">Follow-up</MenuItem>
              <MenuItem value="procedure">Procedure</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              fullWidth
              label="Status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="scheduled">Scheduled</MenuItem>
              <MenuItem value="confirmed">Confirmed</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="no-show">No-show</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleApplyFilters}
              sx={{ height: 40 }}
            >
              Apply
            </Button>
          </Grid>

          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleResetFilters}
              sx={{ height: 40 }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Appointments"
            value={analytics.summary.totalAppointments}
            icon={<EventAvailable sx={{ fontSize: 40, color: '#2196F3' }} />}
            color="#2196F3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={analytics.summary.completedAppointments}
            subtitle={`${analytics.summary.completionRate}% completion rate`}
            icon={<CheckCircle sx={{ fontSize: 40, color: '#4CAF50' }} />}
            color="#4CAF50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="No-Show Rate"
            value={`${analytics.noShowRate}%`}
            subtitle={`${analytics.statusCounts['no-show']} no-shows`}
            icon={<PersonOff sx={{ fontSize: 40, color: '#F44336' }} />}
            color="#F44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancellation Rate"
            value={`${analytics.cancellationRate}%`}
            subtitle={`${analytics.statusCounts.cancelled} cancelled`}
            icon={<EventBusy sx={{ fontSize: 40, color: '#FF9800' }} />}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Requirement 20.1: Appointment counts by status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Appointments by Status
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {statusData.map((item) => (
                <Chip
                  key={item.name}
                  label={`${item.name}: ${item.value}`}
                  size="small"
                  sx={{ backgroundColor: item.color, color: 'white' }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Requirement 20.3: Average duration by type */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Average Duration by Type (minutes)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="duration" fill="#2196F3">
                  {durationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Requirement 20.4: Patient volume trends - Daily */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Patient Volume Trends (Daily)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.patientVolumeTrends.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2196F3" 
                  strokeWidth={2}
                  name="Completed Appointments"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Requirement 20.4: Patient volume trends - Weekly */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Weekly Volume Trends
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.patientVolumeTrends.weekly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tickFormatter={(week) => format(new Date(week), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(week) => `Week of ${format(new Date(week), 'MMM d, yyyy')}`}
                />
                <Bar dataKey="count" fill="#4CAF50" name="Completed Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Requirement 20.4: Patient volume trends - Monthly */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Monthly Volume Trends
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.patientVolumeTrends.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(month) => {
                    const [year, monthNum] = month.split('-');
                    return format(new Date(year, monthNum - 1), 'MMM yyyy');
                  }}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(month) => {
                    const [year, monthNum] = month.split('-');
                    return format(new Date(year, monthNum - 1), 'MMMM yyyy');
                  }}
                />
                <Bar dataKey="count" fill="#FF9800" name="Completed Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Additional Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Additional Metrics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2196F3' }}>
                    {analytics.summary.avgAppointmentsPerDay}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Appointments/Day
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                    {analytics.summary.totalScheduled}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Scheduled
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#FF9800' }}>
                    {analytics.statusCounts.scheduled + analytics.statusCounts.confirmed}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#9C27B0' }}>
                    {analytics.summary.completionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Stat Card Component
 * Displays a single statistic with icon
 */
function StatCard({ title, value, subtitle, icon, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );
}
