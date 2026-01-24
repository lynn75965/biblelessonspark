import { Step } from 'react-joyride';

export const signupTour: Step[] = [
  {
    target: 'body',
    content: "Welcome to BibleLessonSpark! Fill out the form below to create your free account. After you submit, you'll receive a verification email — click the link in that email, then return here to sign in.",
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="signup-create-button"]',
    content: "When you've entered your information, click here. Then check your email for a verification link before signing in.",
    placement: 'top',
  },
];
