/**
 * useTour Hook
 * Manages guided tour state with localStorage persistence
 *
 * SSOT: Tour definitions in src/tours/*.ts
 * Storage keys use version suffix for easy reset on tour updates
 */

import { useState, useEffect, useCallback } from 'react';
import { CallBackProps, STATUS } from 'react-joyride';

interface UseTourOptions {
  tourKey: string;
  autoStart?: boolean;
  daysBeforeRepeat?: number;
}

export function useTour({ tourKey, autoStart = true, daysBeforeRepeat = 30 }: UseTourOptions) {
  const [runTour, setRunTour] = useState(false);
  const storageKey = 'tour_' + tourKey + '_v1';
  const timestampKey = 'tour_' + tourKey + '_lastVisit';

  useEffect(() => {
    if (!autoStart) return;

    const hasSeenTour = localStorage.getItem(storageKey);
    const lastVisit = localStorage.getItem(timestampKey);
    const now = Date.now();

    // Auto-run if never seen
    if (!hasSeenTour) {
      setRunTour(true);
      return;
    }

    // Auto-run if away for daysBeforeRepeat days
    if (lastVisit && daysBeforeRepeat > 0) {
      const daysSinceVisit = (now - parseInt(lastVisit, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceVisit >= daysBeforeRepeat) {
        setRunTour(true);
      }
    }

    // Update last visit timestamp
    localStorage.setItem(timestampKey, now.toString());
  }, [autoStart, storageKey, timestampKey, daysBeforeRepeat]);

  const handleTourCallback = useCallback((data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem(storageKey, 'true');
      localStorage.setItem(timestampKey, Date.now().toString());
      setRunTour(false);
    }
  }, [storageKey, timestampKey]);

  const startTour = useCallback(() => {
    setRunTour(true);
  }, []);

  const stopTour = useCallback(() => {
    setRunTour(false);
  }, []);

  return {
    runTour,
    startTour,
    stopTour,
    handleTourCallback,
  };
}
