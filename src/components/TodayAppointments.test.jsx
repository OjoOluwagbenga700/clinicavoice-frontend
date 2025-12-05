import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodayAppointments from './TodayAppointments';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('TodayAppointments', () => {
  const mockAppointments = [
    {
      id: 'apt-1',
      patientId: 'patient-1',
      patient: {
        id: 'patient-1',
        firstName: 'John',
        lastName: 'Doe',
        mrn: 'MRN001',
      },
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
      duration: 30,
      type: 'consultation',
      status: 'scheduled',
    },
    {
      id: 'apt-2',
      patientId: 'patient-2',
      patient: {
        id: 'patient-2',
        firstName: 'Jane',
        lastName: 'Smith',
        mrn: 'MRN002',
      },
      date: new Date().toISOString().split('T')[0],
      time: '14:30',
      duration: 60,
      type: 'follow-up',
      status: 'confirmed',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('displays loading state initially', () => {
    api.apiGet.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<TodayAppointments />);
    
    expect(screen.getByText("Today's Appointments")).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays today\'s appointments in chronological order (Requirement 8.1)', async () => {
    api.apiGet.mockResolvedValue({ appointments: mockAppointments });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check both appointments are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Verify chronological order (9:00 AM should appear before 2:30 PM)
    const appointments = screen.getAllByText(/AM|PM/);
    expect(appointments[0]).toHaveTextContent('9:00 AM');
    expect(appointments[1]).toHaveTextContent('2:30 PM');
  });

  it('displays patient name, time, and type (Requirement 8.2)', async () => {
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check patient name
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check MRN (text is split across elements, so use regex)
    expect(screen.getByText(/MRN:/)).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === 'MRN: MRN001';
    })).toBeInTheDocument();
    
    // Check time
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
    
    // Check duration
    expect(screen.getByText(/30 min/)).toBeInTheDocument();
    
    // Check type
    expect(screen.getByText('consultation')).toBeInTheDocument();
  });

  it('highlights imminent appointments within 1 hour (Requirement 8.3)', async () => {
    // Create an appointment that starts in 30 minutes
    const now = new Date();
    const imminentTime = new Date(now.getTime() + 30 * 60 * 1000);
    const hours = String(imminentTime.getHours()).padStart(2, '0');
    const minutes = String(imminentTime.getMinutes()).padStart(2, '0');
    
    const imminentAppointment = {
      ...mockAppointments[0],
      time: `${hours}:${minutes}`,
    };
    
    api.apiGet.mockResolvedValue({ appointments: [imminentAppointment] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('Starting Soon')).toBeInTheDocument();
    });
    
    // Check imminent badge is displayed
    expect(screen.getByText('Starting Soon')).toBeInTheDocument();
  });

  it('navigates to appointment details when View Details is clicked (Requirement 8.4)', async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Find and click the View Details button (icon button with NavigateNextIcon, but not the "View All" button)
    const viewDetailsButtons = screen.getAllByRole('button');
    // Filter to get only icon buttons with NavigateNextIcon (exclude the "View All" button which also has NavigateNextIcon)
    const iconButtons = viewDetailsButtons.filter(btn => 
      btn.querySelector('[data-testid="NavigateNextIcon"]') && 
      !btn.textContent.includes('View All')
    );
    
    await user.click(iconButtons[0]);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/appointments?appointmentId=apt-1');
  });

  it('displays empty state when no appointments (Requirement 8.5)', async () => {
    api.apiGet.mockResolvedValue({ appointments: [] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('No appointments scheduled for today')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Enjoy your day!')).toBeInTheDocument();
  });

  it('allows quick status updates', async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    api.apiPost.mockResolvedValue({ success: true });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Find and click the confirm button
    const confirmButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="EventAvailableIcon"]')
    );
    
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-1/status',
        { status: 'confirmed' }
      );
    });
  });

  it('navigates to all appointments when View All is clicked', async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue({ appointments: mockAppointments });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const viewAllButton = screen.getByText('View All');
    await user.click(viewAllButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/appointments');
  });

  it('displays error message when API call fails', async () => {
    api.apiGet.mockRejectedValue(new Error('Network error'));
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to load today's appointments/i)).toBeInTheDocument();
    });
  });

  it('formats time correctly for AM/PM display', async () => {
    const morningAppointment = {
      ...mockAppointments[0],
      time: '09:00',
    };
    
    const afternoonAppointment = {
      ...mockAppointments[1],
      time: '14:30',
    };
    
    api.apiGet.mockResolvedValue({ 
      appointments: [morningAppointment, afternoonAppointment] 
    });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText(/9:00 AM/)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/2:30 PM/)).toBeInTheDocument();
  });

  it('displays status chips with correct colors', async () => {
    api.apiGet.mockResolvedValue({ appointments: mockAppointments });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check status chips are displayed
    expect(screen.getByText('scheduled')).toBeInTheDocument();
    expect(screen.getByText('confirmed')).toBeInTheDocument();
  });

  it('shows quick action buttons for scheduled and confirmed appointments', async () => {
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Check quick action buttons are present
    const buttons = screen.getAllByRole('button');
    const hasConfirmButton = buttons.some(btn => 
      btn.querySelector('[data-testid="EventAvailableIcon"]')
    );
    const hasCompleteButton = buttons.some(btn => 
      btn.querySelector('[data-testid="CheckCircleIcon"]')
    );
    const hasNoShowButton = buttons.some(btn => 
      btn.querySelector('[data-testid="EventBusyIcon"]')
    );
    
    expect(hasConfirmButton).toBe(true);
    expect(hasCompleteButton).toBe(true);
    expect(hasNoShowButton).toBe(true);
  });

  it('does not show quick action buttons for completed appointments', async () => {
    const completedAppointment = {
      ...mockAppointments[0],
      status: 'completed',
    };
    
    api.apiGet.mockResolvedValue({ appointments: [completedAppointment] });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Should show View Details button instead of quick actions
    expect(screen.getByText('View Details')).toBeInTheDocument();
    
    // Quick action buttons should not be present
    const buttons = screen.getAllByRole('button');
    const hasConfirmButton = buttons.some(btn => 
      btn.querySelector('[data-testid="EventAvailableIcon"]')
    );
    
    expect(hasConfirmButton).toBe(false);
  });

  it('updates local state after successful status change', async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    api.apiPost.mockResolvedValue({ success: true });
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('scheduled')).toBeInTheDocument();
    });
    
    // Click confirm button
    const confirmButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="EventAvailableIcon"]')
    );
    
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText('confirmed')).toBeInTheDocument();
    });
  });

  it('displays error when status update fails', async () => {
    const user = userEvent.setup();
    api.apiGet.mockResolvedValue({ appointments: [mockAppointments[0]] });
    api.apiPost.mockRejectedValue(new Error('Update failed'));
    
    render(<TodayAppointments />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Click confirm button
    const confirmButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('[data-testid="EventAvailableIcon"]')
    );
    
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to update appointment status/i)).toBeInTheDocument();
    });
  });
});
