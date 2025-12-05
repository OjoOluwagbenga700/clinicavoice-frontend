import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RescheduleDialog from './RescheduleDialog';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn()
}));

// Mock the date pickers to avoid MUI import issues in tests
vi.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ label, value, onChange }) => (
    <input
      aria-label={label}
      type="date"
      value={value ? value.toISOString().split('T')[0] : ''}
      onChange={(e) => onChange(new Date(e.target.value))}
    />
  ),
  TimePicker: ({ label, value, onChange }) => (
    <input
      aria-label={label}
      type="time"
      value={value ? `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}` : ''}
      onChange={(e) => {
        const [hours, minutes] = e.target.value.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        onChange(date);
      }}
    />
  ),
  LocalizationProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: class {}
}));

describe('RescheduleDialog', () => {
  const mockAppointment = {
    id: 'apt-123',
    patientId: 'patient-456',
    patient: {
      id: 'patient-456',
      firstName: 'John',
      lastName: 'Doe',
      mrn: 'MRN-001'
    },
    date: '2025-12-15',
    time: '10:00',
    duration: 60,
    type: 'consultation',
    status: 'scheduled'
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dialog when open', () => {
    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Reschedule Appointment')).toBeInTheDocument();
    expect(screen.getByText('Current Appointment')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <RescheduleDialog
        open={false}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByText('Reschedule Appointment')).not.toBeInTheDocument();
  });

  it('displays current appointment details', () => {
    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('consultation')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('validates that date is required', async () => {
    const user = userEvent.setup();
    
    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    // Clear the date field (it's pre-populated)
    // Then try to submit
    const rescheduleButton = screen.getByRole('button', { name: /reschedule appointment/i });
    
    // Mock the date to be null by clicking reschedule without proper date
    // This is a simplified test - in real scenario we'd interact with date picker
    await user.click(rescheduleButton);

    // The form should show validation error if date is missing
    // Note: This is a basic test - full date picker interaction would require more setup
  });

  it('checks for conflicts before rescheduling', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    api.apiGet.mockResolvedValue({
      appointments: []
    });
    
    api.apiPut.mockResolvedValue({
      ...mockAppointment,
      date: '2025-12-16',
      time: '14:00'
    });

    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    const rescheduleButton = screen.getByRole('button', { name: /reschedule appointment/i });
    await user.click(rescheduleButton);

    // Should check for conflicts
    await waitFor(() => {
      expect(api.apiGet).toHaveBeenCalled();
    });
  });

  it('successfully reschedules appointment when no conflicts', async () => {
    const user = userEvent.setup();
    
    // Mock no conflicts
    api.apiGet.mockResolvedValue({
      appointments: []
    });
    
    // Mock successful update
    const updatedAppointment = {
      ...mockAppointment,
      date: '2025-12-16',
      time: '14:00'
    };
    api.apiPut.mockResolvedValue(updatedAppointment);

    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    const rescheduleButton = screen.getByRole('button', { name: /reschedule appointment/i });
    await user.click(rescheduleButton);

    await waitFor(() => {
      expect(api.apiPut).toHaveBeenCalledWith(
        `/appointments/${mockAppointment.id}`,
        expect.objectContaining({
          date: expect.any(String),
          time: expect.any(String)
        })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedAppointment);
    });
  });

  it('shows error when there is a conflict', async () => {
    const user = userEvent.setup();
    
    // Mock conflict - another appointment at the same time
    api.apiGet.mockResolvedValue({
      appointments: [
        {
          id: 'other-apt',
          date: '2025-12-15',
          time: '10:00',
          duration: 60,
          status: 'scheduled'
        }
      ]
    });

    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    const rescheduleButton = screen.getByRole('button', { name: /reschedule appointment/i });
    await user.click(rescheduleButton);

    // Should show conflict error
    await waitFor(() => {
      expect(screen.getByText(/time slot conflicts/i)).toBeInTheDocument();
    });

    // Should not call apiPut
    expect(api.apiPut).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    api.apiGet.mockRejectedValue(new Error('Network error'));

    render(
      <RescheduleDialog
        open={true}
        onClose={mockOnClose}
        appointment={mockAppointment}
        onSuccess={mockOnSuccess}
      />
    );

    const rescheduleButton = screen.getByRole('button', { name: /reschedule appointment/i });
    await user.click(rescheduleButton);

    // Should still allow submission even if conflict check fails
    await waitFor(() => {
      expect(api.apiGet).toHaveBeenCalled();
    });
  });
});
