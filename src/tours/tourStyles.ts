/**
 * Tour Styles Configuration
 * SSOT for Joyride styling across the app
 * Uses brand colors from BRANDING config
 */

import { Styles } from 'react-joyride';

export const TOUR_STYLES: Partial<Styles> = {
  options: {
    primaryColor: '#5c7c3a', // Forest Green (brand primary)
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    arrowColor: '#ffffff',
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10000,
  },
  tooltip: {
    borderRadius: 8,
    padding: 16,
  },
  tooltipContainer: {
    textAlign: 'left' as const,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  tooltipContent: {
    fontSize: 14,
    lineHeight: 1.5,
  },
  buttonNext: {
    backgroundColor: '#5c7c3a',
    borderRadius: 6,
    padding: '8px 16px',
  },
  buttonBack: {
    color: '#5c7c3a',
    marginRight: 8,
  },
  buttonSkip: {
    color: '#6b7280',
  },
};

export const TOUR_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Done',
  next: 'Next',
  skip: 'Skip tour',
};
