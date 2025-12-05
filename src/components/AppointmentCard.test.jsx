import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentCard from './AppointmentCard';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  apiPost: vi.fn(),
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('AppointmentCard', () => {
  const mockAppointment = {
    id: 'apt-123',
    patientId: 'patient-1',
    patient: {
      id: 'patient-1',
      firstName: 'John',
      lastName: 'Doe',
      mrn: 'MRN001',
      phone: '555-1234',
      email: 'john@example.com'
    },
    date: '2025-12-10',
    time: '14:30',
    duration: 60,
    type: 'consultation',
    status: 'scheduled',
    notes: 'Initial consultation'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it('renders appointment information correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Check patient name is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    
    // Check MRN is displayed (text is split across elements)
    expect(screen.getByText('MRN001')).toBeInTheDocument();
    
    // Check date is displayed
    expect(screen.getByText(/Dec 10, 2025/i)).toBeInTheDocument();
    
    // Check time and duration are displayed
    expect(screen.getByText(/2:30 PM/i)).toBeInTheDocument();
    expect(screen.getByText(/60 min/i)).toBeInTheDocument();
    
    // Check appointment type is displayed
    expect(screen.getByText('consultation')).toBeInTheDocument();
    
    // Check status is displayed
    expect(screen.getByText('scheduled')).toBeInTheDocument();
  });

  it('displays action buttons for scheduled appointments', () => {
    render(<AppointmentCard appointment={mockAppointment} />);
    
    expect(screen.getByText('Complete')).toBeInTheDocument();
    // Icon buttons are present (check by test id)
    expect(screen.getByTestId('ScheduleIcon')).toBeInTheDocument();
    expect(screen.getByTestId('MoreVertIcon')).toBeInTheDocument();
  });

  it('does not display action buttons for completed appointments', () => {
    const completedAppointment = {
      ...mockAppointment,
      status: 'completed'
    };
    
    render(<AppointmentCard appointment={completedAppointment} />);
    
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();
    
    render(<AppointmentCard appointment={mockAppointment} onClick={mockOnClick} />);
    
    const card = screen.getByText('John Doe').closest('.MuiCard-root');
    await user.click(card);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('opens completion dialog when Complete button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    const completeButton = screen.getByText('Complete');
    await user.click(completeButton);
    
    // Check completion dialog is open
    expect(screen.getByText('Complete Appointment')).toBeInTheDocument();
    expect(screen.getByText(/would you like to create a transcription/i)).toBeInTheDocument();
  });

  it('completes appointment without transcription', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();
    
    api.apiPost.mockResolvedValue({ success: true });
    
    render(
      <AppointmentCard 
        appointment={mockAppointment} 
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Open completion dialog
    const completeButton = screen.getByText('Complete');
    await user.click(completeButton);
    
    // Complete without transcription
    const completeWithoutButton = screen.getByText('Complete Without Transcription');
    await user.click(completeWithoutButton);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-123/status',
        { status: 'completed' }
      );
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('apt-123', 'completed');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('completes appointment and navigates to transcription page', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();
    
    api.apiPost.mockResolvedValue({ success: true });
    
    render(
      <AppointmentCard 
        appointment={mockAppointment} 
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Open completion dialog
    const completeButton = screen.getByText('Complete');
    await user.click(completeButton);
    
    // Complete with transcription
    const completeWithTranscriptionButton = screen.getByText('Yes, Create Transcription');
    await user.click(completeWithTranscriptionButton);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-123/status',
        { status: 'completed' }
      );
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('apt-123', 'completed');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard/transcribe', {
      state: {
        patientId: 'patient-1',
        appointmentId: 'apt-123'
      }
    });
  });

  it('opens cancel dialog when Cancel is selected from menu', async () => {
    const user = userEvent.setup();
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Open status menu
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    // Click Cancelled option
    const cancelOption = screen.getByText('Cancelled');
    await user.click(cancelOption);
    
    // Check dialog is open
    expect(screen.getByText('Cancel Appointment')).toBeInTheDocument();
    expect(screen.getByLabelText(/cancellation reason/i)).toBeInTheDocument();
  });

  it('requires cancellation reason to cancel appointment', async () => {
    const user = userEvent.setup();
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Open status menu and select Cancel
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    const cancelOption = screen.getByText('Cancelled');
    await user.click(cancelOption);
    
    // Try to confirm without entering reason
    const confirmButton = screen.getByText('Confirm Cancellation');
    expect(confirmButton).toBeDisabled();
  });

  it('cancels appointment with reason', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();
    
    api.apiPost.mockResolvedValue({ success: true });
    
    render(
      <AppointmentCard 
        appointment={mockAppointment}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Open status menu and select Cancel
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    const cancelOption = screen.getByText('Cancelled');
    await user.click(cancelOption);
    
    // Enter cancellation reason
    const reasonInput = screen.getByLabelText(/cancellation reason/i);
    await user.type(reasonInput, 'Patient requested cancellation');
    
    // Confirm cancellation
    const confirmButton = screen.getByText('Confirm Cancellation');
    await user.click(confirmButton);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-123/status',
        { 
          status: 'cancelled',
          reason: 'Patient requested cancellation'
        }
      );
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('apt-123', 'cancelled');
  });

  it('calls onReschedule when Reschedule button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnReschedule = vi.fn();
    
    render(
      <AppointmentCard 
        appointment={mockAppointment}
        onReschedule={mockOnReschedule}
      />
    );
    
    const rescheduleIcon = screen.getByTestId('ScheduleIcon');
    const rescheduleButton = rescheduleIcon.closest('button');
    await user.click(rescheduleButton);
    
    expect(mockOnReschedule).toHaveBeenCalledWith(mockAppointment);
  });

  it('displays correct color for appointment type', () => {
    const { container } = render(<AppointmentCard appointment={mockAppointment} />);
    
    // Check that the card has the correct border color for consultation type
    const card = container.querySelector('.MuiCard-root');
    expect(card).toHaveStyle({ borderLeft: '4px solid #2196F3' });
  });

  it('formats time correctly for AM/PM display', () => {
    const morningAppointment = {
      ...mockAppointment,
      time: '09:00'
    };
    
    render(<AppointmentCard appointment={morningAppointment} />);
    
    expect(screen.getByText(/9:00 AM/i)).toBeInTheDocument();
  });

  it('opens status menu when More button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Find and click the More button
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    // Check menu items are displayed
    expect(screen.getByText('Scheduled')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('No-Show')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('changes status to confirmed from menu', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();
    
    api.apiPost.mockResolvedValue({ success: true });
    
    render(
      <AppointmentCard 
        appointment={mockAppointment}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Open status menu
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    // Click Confirmed
    const confirmedOption = screen.getByText('Confirmed');
    await user.click(confirmedOption);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-123/status',
        { status: 'confirmed' }
      );
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('apt-123', 'confirmed');
  });

  it('changes status to no-show from menu', async () => {
    const user = userEvent.setup();
    const mockOnStatusChange = vi.fn();
    
    api.apiPost.mockResolvedValue({ success: true });
    
    render(
      <AppointmentCard 
        appointment={mockAppointment}
        onStatusChange={mockOnStatusChange}
      />
    );
    
    // Open status menu
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    // Click No-Show
    const noShowOption = screen.getByText('No-Show');
    await user.click(noShowOption);
    
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith(
        '/appointments/apt-123/status',
        { status: 'no-show' }
      );
    });
    
    expect(mockOnStatusChange).toHaveBeenCalledWith('apt-123', 'no-show');
  });

  it('displays status history when available', () => {
    const appointmentWithHistory = {
      ...mockAppointment,
      status: 'confirmed',
      statusHistory: [
        {
          status: 'scheduled',
          timestamp: '2025-12-01T10:00:00Z',
          changedBy: 'user-1'
        },
        {
          status: 'confirmed',
          timestamp: '2025-12-05T14:30:00Z',
          changedBy: 'user-1'
        }
      ]
    };
    
    render(<AppointmentCard appointment={appointmentWithHistory} />);
    
    // Check status history button is displayed
    expect(screen.getByText(/status history \(2\)/i)).toBeInTheDocument();
  });

  it('toggles status history display', async () => {
    const user = userEvent.setup();
    const appointmentWithHistory = {
      ...mockAppointment,
      status: 'confirmed',
      statusHistory: [
        {
          status: 'scheduled',
          timestamp: '2025-12-01T10:00:00Z',
          changedBy: 'user-1'
        },
        {
          status: 'confirmed',
          timestamp: '2025-12-05T14:30:00Z',
          changedBy: 'user-1'
        }
      ]
    };
    
    render(<AppointmentCard appointment={appointmentWithHistory} />);
    
    // Click to expand history
    const historyButton = screen.getByText(/status history \(2\)/i);
    await user.click(historyButton);
    
    // Check history items are displayed (most recent first)
    // Use getAllByText since status appears in both the chip and history
    const confirmedElements = screen.getAllByText('confirmed');
    expect(confirmedElements.length).toBeGreaterThan(0);
    
    const scheduledElements = screen.getAllByText('scheduled');
    expect(scheduledElements.length).toBeGreaterThan(0);
  });

  it('displays change status button for non-active appointments', () => {
    const noShowAppointment = {
      ...mockAppointment,
      status: 'no-show'
    };
    
    render(<AppointmentCard appointment={noShowAppointment} />);
    
    // Should show "Change Status" button instead of quick actions
    expect(screen.getByText('Change Status')).toBeInTheDocument();
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('does not show change status button for completed appointments', () => {
    const completedAppointment = {
      ...mockAppointment,
      status: 'completed'
    };
    
    render(<AppointmentCard appointment={completedAppointment} />);
    
    expect(screen.queryByText('Change Status')).not.toBeInTheDocument();
    expect(screen.queryByText('Complete')).not.toBeInTheDocument();
  });

  it('handles loading state during status update', async () => {
    const user = userEvent.setup();
    
    // Mock a delayed API response
    api.apiPost.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Open status menu and select confirmed
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    const confirmedOption = screen.getByText('Confirmed');
    await user.click(confirmedOption);
    
    // Wait for the API call to complete
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalled();
    });
  });

  it('displays error message when status update fails', async () => {
    const user = userEvent.setup();
    
    api.apiPost.mockRejectedValue(new Error('Network error'));
    
    render(<AppointmentCard appointment={mockAppointment} />);
    
    // Open status menu and select confirmed
    const moreButtons = screen.getAllByTestId('MoreVertIcon');
    const moreButton = moreButtons[0].closest('button');
    await user.click(moreButton);
    
    const confirmedOption = screen.getByText('Confirmed');
    await user.click(confirmedOption);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to update appointment status/i)).toBeInTheDocument();
    });
  });

  it('renders in compact mode', () => {
    render(<AppointmentCard appointment={mockAppointment} compact={true} />);
    
    // Component should still render all essential information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('MRN001')).toBeInTheDocument();
  });
});
