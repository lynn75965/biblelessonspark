import { Step } from 'react-joyride';

export const lessonLibraryTour: Step[] = [
  {
    target: '[data-tour="library-tab"]',
    content: "Your saved lessons appear here. Each one shows the passage, age group, and theology profile.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="library-view-button"]',
    content: "Click View to open any lesson. You can print it, download it, or review it anytime.",
    placement: 'top',
  },
];
