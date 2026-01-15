/**
 * Debug Panel - Development/Admin overlay for job tracking
 * Updated: January 15, 2026 - SSOT color compliance
 */
import React from 'react';
import { BRANDING } from '@/config/branding';

// SSOT: Debug panel styling uses brand dark color for consistent appearance
const DEBUG_PANEL_STYLES = {
  background: BRANDING.colors.accent.dark, // Dark background for visibility
  shadow: `0 4px 12px ${BRANDING.colors.accent.dark}40`, // 25% opacity shadow
};

interface DebugPanelProps {
  job: {
    jobId?: string;
    sessionId?: string;
    uploadId?: string;
    fileHash?: string;
    source?: string;
    state: string;
    progress?: number;
  } | null;
}

export default function DebugPanel({ job }: DebugPanelProps) {
  if (!job || job.state === 'idle' || job.state === 'done' || job.state === 'failed') {
    return null;
  }
  const { jobId, sessionId, uploadId, fileHash, source, state, progress } = job;
  return (
    <div style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      background: DEBUG_PANEL_STYLES.background,
      color: 'white',
      padding: '10px 14px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      opacity: 0.9,
      width: '280px',
      boxShadow: DEBUG_PANEL_STYLES.shadow,
    }}>
      <strong>Job Tracker</strong><br />
      Job: {jobId || '—'}<br />
      State: {state} {progress ? `(${progress}%)` : ''}<br />
      sessionId: {sessionId?.slice(0, 8)}…<br />
      uploadId: {uploadId?.slice(0, 8)}…<br />
      fileHash: {fileHash?.slice(0, 8)}…<br />
      source: {source || '—'}
    </div>
  );
}
