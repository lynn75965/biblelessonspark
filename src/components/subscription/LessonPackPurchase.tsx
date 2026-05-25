// ============================================================
// BibleLessonSpark - LESSON PACK PURCHASE
// Location: src/components/subscription/LessonPackPurchase.tsx
//
// Reusable lesson-pack purchase UI. Renders the active lesson packs
// (small / medium / large) with display name, price, and lesson count,
// and fires onPurchase(packType) when a pack is selected.
//
// SSOT: all pack display data comes from LESSON_PACKS in
// src/constants/orgPricingConfig.ts via getActiveLessonPacks(). This
// component is presentational only -- the caller owns the checkout call.
// Org path: purchase-lesson-pack Edge Function (see OrgPoolStatusCard).
// Individual/team-lead checkout is deferred until its backend exists.
// ============================================================

import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { getActiveLessonPacks } from "@/constants/orgPricingConfig";

interface LessonPackPurchaseProps {
  /** Called with the selected pack_type (small | medium | large). */
  onPurchase: (packType: string) => void;
  /** Disables all purchase buttons while a checkout is in flight. */
  loading?: boolean;
}

function formatPackPrice(price: number): string {
  return price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`;
}

export function LessonPackPurchase({ onPurchase, loading = false }: LessonPackPurchaseProps) {
  const packs = getActiveLessonPacks();

  return (
    <div className="space-y-3" role="list" aria-label="Lesson packs available for purchase">
      {packs.map((pack) => {
        const priceText = formatPackPrice(pack.price);
        return (
          <div
            key={pack.packType}
            role="listitem"
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
          >
            <div className="min-w-0">
              <p className="font-medium">{pack.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {pack.description}
              </p>
            </div>
            <Button
              onClick={() => onPurchase(pack.packType)}
              disabled={loading}
              size="sm"
              className="shrink-0"
              aria-label={`Purchase ${pack.displayName}, ${pack.lessonsIncluded} lessons, for ${priceText}`}
            >
              <Package className="h-4 w-4 mr-1" aria-hidden="true" />
              {priceText}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
