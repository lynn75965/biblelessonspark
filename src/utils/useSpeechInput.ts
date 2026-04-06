// ============================================================================
// useSpeechInput -- Reusable Web Speech API hook
// BibleLessonSpark
// Uses browser-native SpeechRecognition (no third-party service)
// ============================================================================

import { useState, useCallback, useRef, useEffect } from 'react';

// Browser compat: Chrome/Edge use SpeechRecognition, Safari uses webkitSpeechRecognition
const SpeechRecognitionClass =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

/** Whether the current browser supports speech recognition */
export const isSpeechSupported = !!SpeechRecognitionClass;

interface UseSpeechInputOptions {
  /** Called with the final transcript when speech ends */
  onResult: (transcript: string) => void;
  /** Called if recognition encounters an error */
  onError?: (error: string) => void;
  /** Language (default: en-US) */
  lang?: string;
}

interface UseSpeechInputReturn {
  /** Whether recognition is actively listening */
  isListening: boolean;
  /** Start listening */
  start: () => void;
  /** Stop listening */
  stop: () => void;
  /** Toggle listening on/off */
  toggle: () => void;
}

export function useSpeechInput({
  onResult,
  onError,
  lang = 'en-US',
}: UseSpeechInputOptions): UseSpeechInputReturn {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  // Keep refs current without recreating recognition
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (!SpeechRecognitionClass) return;

    // Stop any existing session
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResultRef.current(transcript);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (event: any) => {
      // 'no-speech' and 'aborted' are not real errors
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onErrorRef.current?.(event.error);
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [lang]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return { isListening, start, stop, toggle };
}
