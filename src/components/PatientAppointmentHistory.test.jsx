import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PatientAppointmentHistory from './PatientAppointmentHistory';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  fetchPatientAppointmentHistory: vi.fn()
}));

// Wrapper component for router
const RouterWrapper = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('PatientAppointmentHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display loading state initially', () => {
    api.fetchPatientAppointmentHistory.mockImplementation(() => new Promise(() => {}));
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    expect(screen.getByText('Loading appointment history...')).toBeInTheDocument();
  });

  it('should display empty state when no appointment history (Requirement 17.5)', async () => {
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: [] });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('No appointment history available')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Your past appointments will appear here')).toBeInTheDocument();
  });

  it('should display past appointments with date, clinician name, and status (Requirements 17.1, 17.2)', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-11-15',
        time: '14:30',
        duration: 60,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Smith',
        notes: 'Annual checkup completed'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('November 15, 2024')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Consultation')).toBeInTheDocument();
  });

  it('should display link to associated transcription/report (Requirement 17.3)', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-11-15',
        time: '14:30',
        duration: 60,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Smith',
        transcriptionId: 'trans-123'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('View Associated Report')).toBeInTheDocument();
    });
    
    const reportLink = screen.getByText('View Associated Report').closest('a');
    expect(reportLink).toHaveAttribute('href', '/dashboard/reports?id=trans-123');
  });

  it('should display appointments in chronological order - most recent first (Requirement 17.1)', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-12-01',
        time: '10:00',
        duration: 30,
        type: 'follow-up',
        status: 'completed',
        clinicianName: 'Dr. Jones'
      },
      {
        id: '2',
        date: '2024-11-15',
        time: '14:00',
        duration: 60,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Smith'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('December 1, 2024')).toBeInTheDocument();
    });
    
    const appointments = screen.getAllByText(/Dr\./);
    expect(appointments[0]).toHaveTextContent('Dr. Jones'); // Most recent first
    expect(appointments[1]).toHaveTextContent('Dr. Smith');
  });

  it('should only display completed appointments (Requirement 17.4)', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-11-20',
        time: '10:00',
        duration: 30,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Brown'
      },
      {
        id: '2',
        date: '2024-11-15',
        time: '14:00',
        duration: 60,
        type: 'follow-up',
        status: 'completed',
        clinicianName: 'Dr. White'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getAllByText('Completed')).toHaveLength(2);
    });
    
    // Verify no cancelled or no-show statuses are shown
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    expect(screen.queryByText('No-Show')).not.toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    api.fetchPatientAppointmentHistory.mockRejectedValue(new Error('API Error'));
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load appointment history/)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should display appointment notes when available', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-11-15',
        time: '14:30',
        duration: 60,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Smith',
        notes: 'Patient reported improvement in symptoms'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText(/Patient reported improvement in symptoms/)).toBeInTheDocument();
    });
  });

  it('should not display report link when transcriptionId is not present', async () => {
    const mockAppointments = [
      {
        id: '1',
        date: '2024-11-15',
        time: '14:30',
        duration: 60,
        type: 'consultation',
        status: 'completed',
        clinicianName: 'Dr. Smith'
      }
    ];
    
    api.fetchPatientAppointmentHistory.mockResolvedValue({ appointments: mockAppointments });
    
    render(<PatientAppointmentHistory />, { wrapper: RouterWrapper });
    
    await waitFor(() => {
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
    });
    
    expect(screen.queryByText('View Associated Report')).not.toBeInTheDocument();
  });
});
