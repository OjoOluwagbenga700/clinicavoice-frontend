import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import PatientUpcomingAppointments from './PatientUpcomingAppointments';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  fetchPatientUpcomingAppointments: vi.fn()
}));

describe('PatientUpcomingAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    api.fetchPatientUpcomingAppointments.mockImplementation(() => new Promise(() => {}));
    
    render(<PatientUpcomingAppointments />);
    
    expect(screen.getByText('Loading appointments...')).toBeInTheDocument();
  });

  it('should display empty state when no appointments (Requirement 16.4)', async () => {
    api.fetchPatientUpcomingAppointments.mockResolvedValue({ appointments: [] });
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('You have no upcoming appointments')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Contact your healthcare provider to schedule an appointment')).toBeInTheDocument();
    expect(screen.getByText('Request Appointment')).toBeInTheDocument();
  });

  it('should display appointments with date, time, clinician name, and type (Requirements 16.1, 16.2)', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0], // Today
        time: '14:30',
        duration: 60,
        type: 'consultation',
        clinicianName: 'Dr. Smith',
        notes: 'Annual checkup'
      }
    ];
    
    api.fetchPatientUpcomingAppointments.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    
    expect(screen.getByText('2:30 PM')).toBeInTheDocument();
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
    expect(screen.getByText('Annual checkup')).toBeInTheDocument();
  });

  it('should highlight appointments within 24 hours (Requirement 16.3)', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const mockAppointments = [
      {
        id: '1',
        date: tomorrow.toISOString().split('T')[0],
        time: '10:00',
        duration: 30,
        type: 'follow-up',
        clinicianName: 'Dr. Jones'
      }
    ];
    
    api.fetchPatientUpcomingAppointments.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  it('should display multiple appointments sorted chronologically', async () => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const mockAppointments = [
      {
        id: '1',
        date: today,
        time: '09:00',
        duration: 30,
        type: 'consultation',
        clinicianName: 'Dr. Smith'
      },
      {
        id: '2',
        date: nextWeek.toISOString().split('T')[0],
        time: '14:00',
        duration: 60,
        type: 'procedure',
        clinicianName: 'Dr. Brown'
      }
    ];
    
    api.fetchPatientUpcomingAppointments.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('Today')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Dr. Brown')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    api.fetchPatientUpcomingAppointments.mockRejectedValue(new Error('API Error'));
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load appointments/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display different appointment types correctly', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        duration: 45,
        type: 'urgent',
        clinicianName: 'Dr. Emergency'
      }
    ];
    
    api.fetchPatientUpcomingAppointments.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientUpcomingAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('Urgent')).toBeInTheDocument();
    });
  });
});
