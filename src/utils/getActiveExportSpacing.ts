/**
 * getActiveExportSpacing - Returns EXPORT_SPACING with admin overrides applied
 *
 * SSOT Chain:
 *   Admin Panel -> system_settings DB -> this function -> export utilities
 *
 * This function fetches admin overrides from the database, merges them
 * with EXPORT_SPACING defaults from lessonStructure.ts, and computes
 * all derived values (halfPt, twips, css strings).
 *
 * Usage in export utilities:
 *   const spacing = await getActiveExportSpacing();
 *   // spacing has the same shape as EXPORT_SPACING
 *
 * Includes in-memory caching (5 minute TTL) to avoid repeated DB calls.
 */

import { supabase } from "@/integrations/supabase/client";
import { EXPORT_SPACING, EXPORT_FORMATTING } from "@/constants/lessonStructure";
import { EXPORT_SETTINGS_DB_KEY } from "@/constants/exportSettingsConfig";

// Cache to avoid repeated DB fetches during a single export session
let cachedSpacing: typeof EXPORT_SPACING | null = null;
let cachedFormatting: typeof EXPORT_FORMATTING | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch admin overrides and return a full EXPORT_SPACING object
 * with all derived values (halfPt, twips, css) computed.
 */
export async function getActiveExportSpacing(): Promise<typeof EXPORT_SPACING> {
  // Return cache if fresh
  if (cachedSpacing && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSpacing;
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", EXPORT_SETTINGS_DB_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      // No overrides -- use defaults
      cachedSpacing = { ...EXPORT_SPACING };
      cacheTimestamp = Date.now();
      return cachedSpacing;
    }

    const overrides: Record<string, string | number> = JSON.parse(data.value);

    // Helper to get override or default
    const get = (key: string, fallback: number): number => {
      const val = overrides[key];
      return val !== undefined ? Number(val) : fallback;
    };
    const getStr = (key: string, fallback: string): string => {
      const val = overrides[key];
      return val !== undefined ? String(val) : fallback;
    };

    // Build the merged spacing object with computed derived values
    const fontPrimary = getStr("font_primary", EXPORT_SPACING.fonts.primary);
    const marginsInches = Number(getStr("margins_inches", String(EXPORT_SPACING.margins.inches)));
    const bodyFontPt = get("body_fontPt", EXPORT_SPACING.body.fontPt);
    const titleFontPt = get("title_fontPt", EXPORT_SPACING.title.fontPt);
    const sectionHeaderFontPt = get("sectionHeader_fontPt", EXPORT_SPACING.sectionHeaderFont.fontPt);
    const metadataFontPt = get("metadata_fontPt", EXPORT_SPACING.metadata.fontPt);
    const footerFontPt = get("footer_fontPt", EXPORT_SPACING.footer.fontPt);
    const teaserFontPt = get("teaser_fontPt", EXPORT_SPACING.teaser.fontPt);
    const bodyLineHeight = get("body_lineHeight", EXPORT_SPACING.body.lineHeight);
    const sectionHeaderBeforePt = get("sectionHeader_beforePt", EXPORT_SPACING.sectionHeader.beforePt);
    const sectionHeaderAfterPt = get("sectionHeader_afterPt", EXPORT_SPACING.sectionHeader.afterPt);
    const paragraphAfterPt = get("paragraph_afterPt", EXPORT_SPACING.paragraph.afterPt);

    cachedSpacing = {
      fonts: {
        primary: fontPrimary,
        fallback: "Arial, sans-serif",
        css: `${fontPrimary}, Arial, sans-serif`,
        docx: fontPrimary,
        pdf: "Helvetica", // PDF libs don't support custom fonts
      },

      margins: {
        inches: marginsInches,
        twips: Math.round(marginsInches * 1440),
        css: `${marginsInches}in`,
      },

      sectionHeader: {
        beforePt: sectionHeaderBeforePt,
        afterPt: sectionHeaderAfterPt,
        beforeTwips: sectionHeaderBeforePt * 20,
        afterTwips: sectionHeaderAfterPt * 20,
      },

      body: {
        fontPt: bodyFontPt,
        fontHalfPt: bodyFontPt * 2,
        lineHeight: bodyLineHeight,
      },

      title: {
        fontPt: titleFontPt,
        fontHalfPt: titleFontPt * 2,
        afterPt: EXPORT_SPACING.title.afterPt,
        afterTwips: EXPORT_SPACING.title.afterTwips,
      },

      sectionHeaderFont: {
        fontPt: sectionHeaderFontPt,
        fontHalfPt: sectionHeaderFontPt * 2,
      },

      teaser: {
        fontPt: teaserFontPt,
        fontHalfPt: teaserFontPt * 2,
        paddingPt: EXPORT_SPACING.teaser.paddingPt,
        marginBeforePt: EXPORT_SPACING.teaser.marginBeforePt,
        marginAfterPt: EXPORT_SPACING.teaser.marginAfterPt,
        marginBeforeTwips: EXPORT_SPACING.teaser.marginBeforeTwips,
        marginAfterTwips: EXPORT_SPACING.teaser.marginAfterTwips,
        borderRadiusPx: EXPORT_SPACING.teaser.borderRadiusPx,
      },

      metadata: {
        fontPt: metadataFontPt,
        fontHalfPt: metadataFontPt * 2,
        afterPt: EXPORT_SPACING.metadata.afterPt,
        afterTwips: EXPORT_SPACING.metadata.afterTwips,
      },

      footer: {
        fontPt: footerFontPt,
        fontHalfPt: footerFontPt * 2,
        marginTopPt: EXPORT_SPACING.footer.marginTopPt,
        marginTopTwips: EXPORT_SPACING.footer.marginTopTwips,
      },

      paragraph: {
        afterPt: paragraphAfterPt,
        afterTwips: paragraphAfterPt * 20,
      },

      listItem: {
        afterPt: paragraphAfterPt,
        afterTwips: paragraphAfterPt * 20,
        indentPt: EXPORT_SPACING.listItem.indentPt,
        indentTwips: EXPORT_SPACING.listItem.indentTwips,
      },

      hr: {
        marginPt: EXPORT_SPACING.hr.marginPt,
        marginTwips: EXPORT_SPACING.hr.marginTwips,
      },

      colors: {
        teaserBg: getStr("colors_teaserBg", EXPORT_SPACING.colors.teaserBg),
        teaserBorder: getStr("colors_teaserBorder", EXPORT_SPACING.colors.teaserBorder),
        teaserText: getStr("colors_teaserText", EXPORT_SPACING.colors.teaserText),
        bodyText: getStr("colors_bodyText", EXPORT_SPACING.colors.bodyText),
        metaText: getStr("colors_metaText", EXPORT_SPACING.colors.metaText),
        footerText: getStr("colors_footerText", EXPORT_SPACING.colors.footerText),
        hrLine: getStr("colors_hrLine", EXPORT_SPACING.colors.hrLine),
      },
    };

    cacheTimestamp = Date.now();
    return cachedSpacing;
  } catch (err) {
    console.error("Error fetching active export spacing:", err);
    return { ...EXPORT_SPACING };
  }
}

/**
 * Fetch admin overrides and return a full EXPORT_FORMATTING object.
 */
export async function getActiveExportFormatting(): Promise<typeof EXPORT_FORMATTING> {
  // Return cache if fresh
  if (cachedFormatting && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    return cachedFormatting;
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", EXPORT_SETTINGS_DB_KEY)
      .maybeSingle();

    if (error || !data?.value) {
      cachedFormatting = { ...EXPORT_FORMATTING };
      return cachedFormatting;
    }

    const overrides: Record<string, string | number> = JSON.parse(data.value);

    cachedFormatting = {
      ...EXPORT_FORMATTING,
      footerText: overrides.label_footerText
        ? String(overrides.label_footerText)
        : EXPORT_FORMATTING.footerText,
      teaserLabel: overrides.label_teaserLabel
        ? String(overrides.label_teaserLabel)
        : EXPORT_FORMATTING.teaserLabel,
    };

    return cachedFormatting;
  } catch (err) {
    console.error("Error fetching active export formatting:", err);
    return { ...EXPORT_FORMATTING };
  }
}

/** Clear the cache (call after admin saves new settings) */
export function clearExportSettingsCache(): void {
  cachedSpacing = null;
  cachedFormatting = null;
  cacheTimestamp = 0;
}
