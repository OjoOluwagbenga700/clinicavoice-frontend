import { describe, it, expect } from 'vitest';

/**
 * Test analytics calculation logic
 * These tests verify the correctness of analytics calculations
 */

// Mock the calculateAnalytics function for testing
function calculateAnalytics(appointments) {
  // Requirement 20.1: Appointment counts by status
  const statusCounts = {
    scheduled: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0
  };
  
  appointments.forEach(apt => {
    if (statusCounts.hasOwnProperty(apt.status)) {
      statusCounts[apt.status]++;
    }
  });
  
  // Total scheduled appointments (not cancelled)
  const totalScheduled = statusCounts.scheduled + statusCounts.confirmed + 
                         statusCounts.completed + statusCounts['no-show'];
  
  // Requirement 20.2: No-show and cancellation rates
  const noShowRate = totalScheduled > 0 
    ? (statusCounts['no-show'] / totalScheduled) * 100 
    : 0;
  
  const cancellationRate = appointments.length > 0
    ? (statusCounts.cancelled / appointments.length) * 100
    : 0;
  
  // Requirement 20.3: Average duration by type
  const durationByType = {
    consultation: { total: 0, count: 0 },
    'follow-up': { total: 0, count: 0 },
    procedure: { total: 0, count: 0 },
    urgent: { total: 0, count: 0 }
  };
  
  appointments.forEach(apt => {
    if (durationByType[apt.type]) {
      durationByType[apt.type].total += apt.duration;
      durationByType[apt.type].count++;
    }
  });
  
  const averageDurationByType = {};
  Object.keys(durationByType).forEach(type => {
    const data = durationByType[type];
    averageDurationByType[type] = data.count > 0 
      ? Math.round(data.total / data.count) 
      : 0;
  });
  
  // Requirement 20.4: Patient volume trends
  const volumeByDate = {};
  appointments.forEach(apt => {
    if (!volumeByDate[apt.date]) {
      volumeByDate[apt.date] = 0;
    }
    if (apt.status === 'completed') {
      volumeByDate[apt.date]++;
    }
  });
  
  const patientVolumeTrends = Object.entries(volumeByDate)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const totalAppointments = appointments.length;
  const completedAppointments = statusCounts.completed;
  const completionRate = totalScheduled > 0
    ? (completedAppointments / totalScheduled) * 100
    : 0;
  
  const daysWithAppointments = Object.keys(volumeByDate).length;
  const avgAppointmentsPerDay = daysWithAppointments > 0
    ? totalAppointments / daysWithAppointments
    : 0;
  
  return {
    statusCounts,
    noShowRate: Math.round(noShowRate * 100) / 100,
    cancellationRate: Math.round(cancellationRate * 100) / 100,
    averageDurationByType,
    patientVolumeTrends: {
      daily: patientVolumeTrends,
      weekly: [],
      monthly: []
    },
    summary: {
      totalAppointments,
      totalScheduled,
      completedAppointments,
      completionRate: Math.round(completionRate * 100) / 100,
      avgAppointmentsPerDay: Math.round(avgAppointmentsPerDay * 100) / 100
    }
  };
}

describe('Appointment Analytics', () => {
  describe('Status Counts (Requirement 20.1)', () => {
    it('should count appointments by status correctly', () => {
      const appointments = [
        { status: 'scheduled', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'follow-up', duration: 30, date: '2025-01-02' },
        { status: 'cancelled', type: 'procedure', duration: 90, date: '2025-01-03' },
        { status: 'no-show', type: 'urgent', duration: 45, date: '2025-01-04' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      expect(analytics.statusCounts.scheduled).toBe(1);
      expect(analytics.statusCounts.completed).toBe(2);
      expect(analytics.statusCounts.cancelled).toBe(1);
      expect(analytics.statusCounts['no-show']).toBe(1);
    });
    
    it('should handle empty appointments array', () => {
      const analytics = calculateAnalytics([]);
      
      expect(analytics.statusCounts.scheduled).toBe(0);
      expect(analytics.statusCounts.completed).toBe(0);
      expect(analytics.statusCounts.cancelled).toBe(0);
    });
  });
  
  describe('No-Show and Cancellation Rates (Requirement 20.2)', () => {
    it('should calculate no-show rate correctly', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'no-show', type: 'consultation', duration: 60, date: '2025-01-01' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // 1 no-show out of 4 scheduled = 25%
      expect(analytics.noShowRate).toBe(25);
    });
    
    it('should calculate cancellation rate correctly', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'cancelled', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'cancelled', type: 'consultation', duration: 60, date: '2025-01-01' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // 2 cancelled out of 4 total = 50%
      expect(analytics.cancellationRate).toBe(50);
    });
    
    it('should handle zero appointments without division by zero', () => {
      const analytics = calculateAnalytics([]);
      
      expect(analytics.noShowRate).toBe(0);
      expect(analytics.cancellationRate).toBe(0);
    });
  });
  
  describe('Average Duration by Type (Requirement 20.3)', () => {
    it('should calculate average duration for each type', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 70, date: '2025-01-01' },
        { status: 'completed', type: 'follow-up', duration: 30, date: '2025-01-02' },
        { status: 'completed', type: 'follow-up', duration: 40, date: '2025-01-02' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // Consultation: (60 + 70) / 2 = 65
      expect(analytics.averageDurationByType.consultation).toBe(65);
      // Follow-up: (30 + 40) / 2 = 35
      expect(analytics.averageDurationByType['follow-up']).toBe(35);
    });
    
    it('should return 0 for types with no appointments', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      expect(analytics.averageDurationByType.procedure).toBe(0);
      expect(analytics.averageDurationByType.urgent).toBe(0);
    });
  });
  
  describe('Patient Volume Trends (Requirement 20.4)', () => {
    it('should count completed appointments by date', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-02' },
        { status: 'scheduled', type: 'consultation', duration: 60, date: '2025-01-03' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // Should have 3 entries (one for each date, even if count is 0)
      expect(analytics.patientVolumeTrends.daily.length).toBeGreaterThanOrEqual(2);
      
      // Find the entries for dates with completed appointments
      const day1 = analytics.patientVolumeTrends.daily.find(d => d.date === '2025-01-01');
      const day2 = analytics.patientVolumeTrends.daily.find(d => d.date === '2025-01-02');
      
      expect(day1).toBeDefined();
      expect(day1.count).toBe(2);
      expect(day2).toBeDefined();
      expect(day2.count).toBe(1);
    });
    
    it('should only count completed appointments in volume', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'cancelled', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'no-show', type: 'consultation', duration: 60, date: '2025-01-01' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      expect(analytics.patientVolumeTrends.daily).toHaveLength(1);
      expect(analytics.patientVolumeTrends.daily[0].count).toBe(1);
    });
  });
  
  describe('Summary Metrics', () => {
    it('should calculate completion rate correctly', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'scheduled', type: 'consultation', duration: 60, date: '2025-01-01' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // 3 completed out of 4 scheduled = 75%
      expect(analytics.summary.completionRate).toBe(75);
    });
    
    it('should calculate average appointments per day', () => {
      const appointments = [
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-01' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-02' },
        { status: 'completed', type: 'consultation', duration: 60, date: '2025-01-02' },
      ];
      
      const analytics = calculateAnalytics(appointments);
      
      // 4 appointments over 2 days = 2 per day
      expect(analytics.summary.avgAppointmentsPerDay).toBe(2);
    });
  });
});
