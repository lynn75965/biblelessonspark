// ============================================================================
// SeriesExportButton.tsx
// Location: src/components/SeriesExport/SeriesExportButton.tsx
//
// Export button shown in the Library series view alongside existing
// single-lesson export buttons. Tier-gated: Personal Plan only.
//
// USAGE:
//   <SeriesExportButton series={series} tier={userTier} />
//
// When the user's tier does not have access, renders a locked button
// with an upgrade tooltip -- never hidden per featureFlags.ts convention.
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Lock, Printer } from 'lucide-react';
import { hasFeatureAccess } from '@/constants/featureFlags';
import { SubscriptionTier } from '@/constants/pricingConfig';
import type { LessonSeries } from '@/constants/seriesConfig';
import { SERIES_EXPORT_UI } from '@/constants/seriesExportConfig';
import { ROUTES } from '@/constants/routes';
import { SeriesExportModal } from './SeriesExportModal';

// ============================================================================
// PROPS
// ============================================================================

interface SeriesExportButtonProps {
  series: LessonSeries;
  tier: SubscriptionTier;
  /** Optional additional Tailwind classes for the button wrapper */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SeriesExportButton({
  series,
  tier,
  className = '',
}: SeriesExportButtonProps): React.ReactElement {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const canExport = hasFeatureAccess(tier, 'seriesExport');

  // --------------------------------------------------------------------------
  // Locked state: show upgrade prompt, button is visually disabled
  // --------------------------------------------------------------------------
  if (!canExport) {
    return (
      <div className={`relative group inline-flex ${className}`}>
        <button
          type="button"
          disabled
          aria-label={SERIES_EXPORT_UI.upgradePrompt}
          className="
            inline-flex items-center gap-2
            px-3 py-1.5 text-sm font-medium rounded-md
            bg-muted text-muted-foreground
            border border-border
            cursor-not-allowed opacity-60
          "
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          {SERIES_EXPORT_UI.buttonLabel}
        </button>

        {/* Upgrade tooltip -- visible on hover */}
        <div
          role="tooltip"
          className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            w-64 px-3 py-2 text-xs text-center
            bg-foreground text-background rounded-md shadow-lg
            opacity-0 group-hover:opacity-100
            pointer-events-none transition-opacity duration-150
            z-50
          "
        >
          {SERIES_EXPORT_UI.upgradePrompt}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Accessible state: open the export modal
  // --------------------------------------------------------------------------
  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          title="Click to choose your export format (Word or PDF) and download your complete series as a printable curriculum document"
          aria-label={`${SERIES_EXPORT_UI.buttonLabel}: ${series.series_name}`}
          className="
            inline-flex items-center gap-2
            px-3 py-1.5 text-sm font-medium rounded-md
            bg-primary text-primary-foreground
            hover:bg-primary/90
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition-colors duration-150
          "
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {SERIES_EXPORT_UI.buttonLabel}
        </button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.PUBLISH + '?type=series&id=' + series.id)}
          aria-label={`Publish: ${series.series_name}`}
          className="
            inline-flex items-center gap-2
            px-3 py-1.5 text-sm font-medium rounded-md
            border border-border text-foreground
            hover:bg-muted/50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            transition-colors duration-150
          "
        >
          <Printer className="h-4 w-4" aria-hidden="true" />
          Publish
        </button>
      </div>

      {isModalOpen && (
        <SeriesExportModal
          series={series}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}