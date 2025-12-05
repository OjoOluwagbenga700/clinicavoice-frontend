import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientSelector from './PatientSelector';
import * as api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => ({
  apiPost: vi.fn(),
}));

describe('PatientSelector', () => {
  const mockPatients = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      mrn: 'MRN001',
      dateOfBirth: '1980-01-15',
      gender: 'male',
      phone: '555-1234',
      email: 'john@example.com'
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      mrn: 'MRN002',
      dateOfBirth: '1990-05-20',
      gender: 'female',
      phone: '555-5678',
      email: 'jane@example.com'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const mockOnChange = vi.fn();
    render(<PatientSelector onChange={mockOnChange} />);
    
    expect(screen.getByLabelText(/select patient/i)).toBeInTheDocument();
  });

  it('displays custom label and placeholder', () => {
    const mockOnChange = vi.fn();
    render(
      <PatientSelector 
        onChange={mockOnChange}
        label="Choose Patient"
        placeholder="Type to search"
      />
    );
    
    expect(screen.getByLabelText(/choose patient/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type to search/i)).toBeInTheDocument();
  });

  it('searches patients when user types', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    api.apiPost.mockResolvedValue({
      results: mockPatients,
      total: 2
    });

    render(<PatientSelector onChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/select patient/i);
    await user.type(input, 'John');

    // Wait for debounce and API call
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/patients/search', {
        query: 'John',
        fields: ['name', 'mrn']
      });
    }, { timeout: 500 });
  });

  it('displays search results with patient name, MRN, and age', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    api.apiPost.mockResolvedValue({
      results: mockPatients,
      total: 2
    });

    render(<PatientSelector onChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/select patient/i);
    await user.type(input, 'John');

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Check that MRN is displayed
    expect(screen.getByText(/MRN: MRN001/i)).toBeInTheDocument();
    
    // Check that age is displayed (calculated from DOB)
    // Age should be 45 years (born 1980-01-15, current date 2025-12-04)
    expect(screen.getByText(/45 yrs/i)).toBeInTheDocument();
  });

  it('calls onChange when patient is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    api.apiPost.mockResolvedValue({
      results: mockPatients,
      total: 2
    });

    render(<PatientSelector onChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/select patient/i);
    await user.type(input, 'John');

    // Wait for results
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on the first result
    await user.click(screen.getByText('John Doe'));

    // Verify onChange was called with the selected patient
    // Note: MUI Autocomplete onChange passes (event, value) but our component
    // receives the patient object as the second parameter
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        mrn: 'MRN001'
      })
    );
  });

  it('displays "Add New Patient" button when onAddNew is provided', () => {
    const mockOnChange = vi.fn();
    const mockOnAddNew = vi.fn();
    
    render(
      <PatientSelector 
        onChange={mockOnChange}
        onAddNew={mockOnAddNew}
      />
    );
    
    expect(screen.getByText(/add new patient/i)).toBeInTheDocument();
  });

  it('calls onAddNew when "Add New Patient" button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    const mockOnAddNew = vi.fn();
    
    render(
      <PatientSelector 
        onChange={mockOnChange}
        onAddNew={mockOnAddNew}
      />
    );
    
    const addButton = screen.getByText(/add new patient/i);
    await user.click(addButton);
    
    expect(mockOnAddNew).toHaveBeenCalled();
  });

  it('displays error message when provided', () => {
    const mockOnChange = vi.fn();
    
    render(
      <PatientSelector 
        onChange={mockOnChange}
        error="Patient selection is required"
      />
    );
    
    expect(screen.getByText(/patient selection is required/i)).toBeInTheDocument();
  });

  it('displays helper text when provided', () => {
    const mockOnChange = vi.fn();
    
    render(
      <PatientSelector 
        onChange={mockOnChange}
        helperText="Select a patient from the list"
      />
    );
    
    expect(screen.getByText(/select a patient from the list/i)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    const mockOnChange = vi.fn();
    
    render(
      <PatientSelector 
        onChange={mockOnChange}
        disabled={true}
      />
    );
    
    const input = screen.getByLabelText(/select patient/i);
    expect(input).toBeDisabled();
  });

  it('handles search errors gracefully', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    api.apiPost.mockRejectedValue(new Error('Network error'));

    render(<PatientSelector onChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/select patient/i);
    await user.type(input, 'John');

    // Wait for error handling
    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalled();
    }, { timeout: 500 });

    // Component should handle error gracefully without crashing
    expect(input).toBeInTheDocument();
  });

  it('does not search when input is empty', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    render(<PatientSelector onChange={mockOnChange} />);
    
    const input = screen.getByLabelText(/select patient/i);
    await user.click(input);

    // Wait to ensure no API call is made
    await waitFor(() => {
      expect(api.apiPost).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });
});
