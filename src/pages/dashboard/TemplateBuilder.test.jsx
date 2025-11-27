import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TemplateBuilder from './TemplateBuilder';
import * as api from '../../services/api';
import * as useUserRoleHook from '../../hooks/useUserRole';

// Mock the API functions
vi.mock('../../services/api', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

// Mock the useUserRole hook
vi.mock('../../hooks/useUserRole', () => ({
  useUserRole: vi.fn(),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock ReactQuill
vi.mock('react-quill', () => ({
  default: ({ value, onChange }) => (
    <textarea
      data-testid="quill-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

const mockTemplates = [
  {
    id: '1',
    name: 'SOAP Note',
    content: 'Subjective:\nObjective:\nAssessment:\nPlan:\nPatient: {{PatientName}}\nDate: {{Date}}',
  },
  {
    id: '2',
    name: 'Progress Note',
    content: 'Patient presents with {{Diagnosis}}. Medications: {{Medications}}',
  },
];

describe('TemplateBuilder - Backend Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useUserRole to return clinician
    vi.mocked(useUserRoleHook.useUserRole).mockReturnValue({
      isClinician: () => true,
      isPatient: () => false,
      loading: false,
    });
  });

  it('should load templates from backend on mount', async () => {
    // Mock API response
    vi.mocked(api.apiGet).mockResolvedValue({
      templates: mockTemplates,
    });

    render(
      <BrowserRouter>
        <TemplateBuilder />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify API was called
    expect(api.apiGet).toHaveBeenCalledWith('/templates');
    
    // Verify first template is loaded
    await waitFor(() => {
      expect(screen.getByDisplayValue('SOAP Note')).toBeInTheDocument();
    });
  });

  it('should create default template if none exist', async () => {
    // Mock empty response
    vi.mocked(api.apiGet).mockResolvedValue({
      templates: [],
    });

    // Mock template creation
    vi.mocked(api.apiPost).mockResolvedValue({
      id: 'new-1',
      name: 'SOAP Note',
      content: 'Subjective:\nObjective:\nAssessment:\nPlan:\nPatient: {{PatientName}}\nDate: {{Date}}',
    });

    render(
      <BrowserRouter>
        <TemplateBuilder />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // Verify default template was created
    expect(api.apiPost).toHaveBeenCalledWith('/templates', expect.objectContaining({
      name: 'SOAP Note',
    }));
  });

  it('should handle template loading errors gracefully', async () => {
    // Mock API error
    vi.mocked(api.apiGet).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <TemplateBuilder />
      </BrowserRouter>
    );

    // Wait for loading to complete and error state to be set
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });

    // The component should show "No templates available" when there's an error
    // because the error sets loading to false but templates array remains empty
    expect(screen.getByText(/No templates available/i)).toBeInTheDocument();
  });
});
