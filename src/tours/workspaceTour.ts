import { Step } from 'react-joyride';

export const workspaceTour: Step[] = [
  {
    target: '[data-tour="workspace-welcome"]',
    content: "You're ready to create your first Bible lesson. Just follow the three steps below — it takes about 3 minutes.",
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="workspace-step1"]',
    content: "Start by typing a Bible passage like 'John 3:16-21' or a topic like 'God's grace.' That's all you need here.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="workspace-step2"]',
    content: "Pick the age group you teach and your theology profile. These shape the lesson's language and depth.",
    placement: 'bottom',
  },
  {
    target: '[data-tour="workspace-step3"]',
    content: "This section makes the lesson fit you and your class — use the down arrows for each label — then save the profile (name it anything).",
    placement: 'bottom',
  },
  {
    target: '[data-tour="workspace-generate"]',
    content: "When you're ready, click here and wait. Your lesson will appear on this page in about a minute.",
    placement: 'top',
  },
];
