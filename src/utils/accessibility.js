/**
 * Accessibility Utilities
 * Helper functions for improving accessibility (a11y)
 */

/**
 * Generate unique ID for form elements
 * @param {string} prefix - Prefix for the ID
 * @returns {string} Unique ID
 */
export const generateId = (prefix = 'element') => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Get ARIA label for status
 * @param {string} status - Status value
 * @returns {string} Human-readable status label
 */
export const getStatusAriaLabel = (status) => {
  const labels = {
    scheduled: 'Scheduled',
    confirmed: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Cancelled',
    'no-show': 'No show',
    active: 'Active',
    inactive: 'Inactive',
    pending: 'Pending activation',
  };
  return labels[status] || status;
};

/**
 * Get ARIA label for appointment type
 * @param {string} type - Appointment type
 * @returns {string} Human-readable type label
 */
export const getAppointmentTypeAriaLabel = (type) => {
  const labels = {
    consultation: 'Consultation appointment',
    'follow-up': 'Follow-up appointment',
    procedure: 'Procedure appointment',
    urgent: 'Urgent appointment',
  };
  return labels[type] || type;
};

/**
 * Format date for screen readers
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Screen reader friendly date
 */
export const formatDateForScreenReader = (dateStr) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Format time for screen readers
 * @param {string} timeStr - Time string (HH:MM)
 * @returns {string} Screen reader friendly time
 */
export const formatTimeForScreenReader = (timeStr) => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeStr;
  }
};

/**
 * Get keyboard navigation hint
 * @param {string} context - Context for the hint
 * @returns {string} Keyboard navigation hint
 */
export const getKeyboardHint = (context) => {
  const hints = {
    list: 'Use arrow keys to navigate, Enter to select',
    dialog: 'Press Escape to close',
    form: 'Use Tab to navigate between fields',
    calendar: 'Use arrow keys to navigate dates, Enter to select',
  };
  return hints[context] || '';
};

/**
 * Announce to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - Priority level ('polite' or 'assertive')
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Check if element is focusable
 * @param {HTMLElement} element - Element to check
 * @returns {boolean}
 */
export const isFocusable = (element) => {
  if (!element) return false;
  
  const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  
  return focusableElements.some(selector => element.matches(selector));
};

/**
 * Trap focus within an element (for modals/dialogs)
 * @param {HTMLElement} element - Container element
 * @returns {Function} Cleanup function
 */
export const trapFocus = (element) => {
  if (!element) return () => {};
  
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  
  const handleKeyDown = (e) => {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  };
  
  element.addEventListener('keydown', handleKeyDown);
  
  // Focus first element
  if (firstFocusable) {
    firstFocusable.focus();
  }
  
  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
};

/**
 * Get color contrast ratio
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @returns {number} Contrast ratio
 */
export const getContrastRatio = (foreground, background) => {
  const getLuminance = (hex) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * Check if color contrast meets WCAG AA standards
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {boolean} largeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {boolean}
 */
export const meetsContrastStandards = (foreground, background, largeText = false) => {
  const ratio = getContrastRatio(foreground, background);
  return largeText ? ratio >= 3 : ratio >= 4.5;
};
