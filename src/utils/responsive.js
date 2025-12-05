/**
 * Responsive Design Utilities
 * Helper functions and constants for responsive design
 */

/**
 * Material-UI breakpoints (in pixels)
 */
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices (phones, < 600px)
  sm: 600,    // Small devices (tablets, >= 600px)
  md: 900,    // Medium devices (small laptops, >= 900px)
  lg: 1200,   // Large devices (desktops, >= 1200px)
  xl: 1536,   // Extra large devices (large desktops, >= 1536px)
};

/**
 * Check if current viewport matches a breakpoint
 * @param {string} breakpoint - Breakpoint name (xs, sm, md, lg, xl)
 * @returns {boolean}
 */
export const isBreakpoint = (breakpoint) => {
  if (typeof window === 'undefined') return false;
  
  const width = window.innerWidth;
  const bp = BREAKPOINTS[breakpoint];
  
  if (!bp && bp !== 0) return false;
  
  // Get next breakpoint
  const breakpointKeys = Object.keys(BREAKPOINTS);
  const currentIndex = breakpointKeys.indexOf(breakpoint);
  const nextBreakpoint = breakpointKeys[currentIndex + 1];
  const nextBp = nextBreakpoint ? BREAKPOINTS[nextBreakpoint] : Infinity;
  
  return width >= bp && width < nextBp;
};

/**
 * Check if viewport is mobile (xs or sm)
 * @returns {boolean}
 */
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < BREAKPOINTS.md;
};

/**
 * Check if viewport is tablet (sm or md)
 * @returns {boolean}
 */
export const isTablet = () => {
  if (typeof window === 'undefined') return false;
  const width = window.innerWidth;
  return width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg;
};

/**
 * Check if viewport is desktop (lg or xl)
 * @returns {boolean}
 */
export const isDesktop = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= BREAKPOINTS.lg;
};

/**
 * Get responsive value based on current breakpoint
 * @param {Object} values - Object with breakpoint keys and values
 * @returns {*} Value for current breakpoint
 * 
 * @example
 * const padding = getResponsiveValue({ xs: 1, sm: 2, md: 3, lg: 4 });
 */
export const getResponsiveValue = (values) => {
  if (typeof window === 'undefined') return values.xs || values.sm || values.md || values.lg || values.xl;
  
  const width = window.innerWidth;
  
  // Find the appropriate value based on current width
  if (width >= BREAKPOINTS.xl && values.xl !== undefined) return values.xl;
  if (width >= BREAKPOINTS.lg && values.lg !== undefined) return values.lg;
  if (width >= BREAKPOINTS.md && values.md !== undefined) return values.md;
  if (width >= BREAKPOINTS.sm && values.sm !== undefined) return values.sm;
  return values.xs;
};

/**
 * Hook to track current breakpoint
 * @returns {string} Current breakpoint name
 */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState('md');
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS.xl) setBreakpoint('xl');
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width >= BREAKPOINTS.md) setBreakpoint('md');
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return breakpoint;
};

// Note: React import needed for useBreakpoint hook
import React from 'react';
