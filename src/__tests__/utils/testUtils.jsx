import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';

// Create a default theme for testing
const theme = createTheme();

/**
 * Custom render function that wraps components with necessary providers
 * @param {React.ReactElement} ui - Component to render
 * @param {Object} options - Render options
 * @returns {Object} - Render result with all utilities
 */
export function renderWithProviders(ui, options = {}) {
  const {
    route = '/',
    theme: customTheme = theme,
    ...renderOptions
  } = options;

  // Set initial route
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <BrowserRouter>
        <ThemeProvider theme={customTheme}>
          <I18nextProvider i18n={i18n}>
            {children}
          </I18nextProvider>
        </ThemeProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create a mock user object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    userId: 'test-user-id',
    username: 'test@example.com',
    attributes: {
      email: 'test@example.com',
      name: 'Test User',
      'custom:user_type': 'clinician',
      ...overrides.attributes,
    },
    ...overrides,
  };
}

/**
 * Create a mock transcription object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock transcription object
 */
export function createMockTranscription(overrides = {}) {
  return {
    id: 'test-transcription-id',
    userId: 'test-user-id',
    patientId: 'test-patient-id',
    audioFileKey: 'audio/test-file.webm',
    audioFileName: 'test-file.webm',
    audioFileSize: 1024000,
    transcript: 'This is a test transcription.',
    status: 'completed',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock template object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock template object
 */
export function createMockTemplate(overrides = {}) {
  return {
    id: 'test-template-id',
    userId: 'test-user-id',
    name: 'Test Template',
    content: '<p>Patient: {{PatientName}}</p><p>Date: {{Date}}</p>',
    placeholders: ['PatientName', 'Date'],
    category: 'SOAP',
    isShared: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock report object for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} - Mock report object
 */
export function createMockReport(overrides = {}) {
  return {
    id: 'test-report-id',
    transcriptionId: 'test-transcription-id',
    patientId: 'test-patient-id',
    clinicianId: 'test-clinician-id',
    patientName: 'John Doe',
    date: new Date('2024-01-01'),
    summary: 'Test report summary',
    content: 'Full report content',
    status: 'finalized',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Wait for a condition to be true
 * @param {Function} condition - Function that returns boolean
 * @param {number} timeout - Maximum time to wait in ms
 * @returns {Promise<void>}
 */
export async function waitForCondition(condition, timeout = 3000) {
  const startTime = Date.now();
  
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
