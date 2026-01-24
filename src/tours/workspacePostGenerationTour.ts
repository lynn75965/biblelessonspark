import { Step } from 'react-joyride';

export const workspacePostGenerationTour: Step[] = [
  {
    target: '[data-tour="lesson-title"]',
    content: "Here's your completed lesson! Scroll down to see all 8 sections.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="lesson-actions"]',
    content: "Use these buttons to print your lesson or save it to your computer. It's also saved in your Lesson Library.",
    placement: 'bottom',
  },
];
