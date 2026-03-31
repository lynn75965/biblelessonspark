// src/constants/digitalWingConfig.ts
// Phase E: Digital Wing SSOT
// All Digital Wing UI strings, share URL base, and feature config live here.
// NEVER hardcode share URLs, labels, or tier requirements outside this file.

export const DIGITAL_WING_BASE_URL = 'https://biblelessonspark.com/share';

export const DIGITAL_WING_FEATURE_FLAG = 'digitalSharing';

export const DIGITAL_WING_TIER_REQUIRED = 'personal';

export const DIGITAL_WING_UI = {
  // Share controls
  shareLabel:              'Share Online',
  shareButtonEnable:       'Create Share Link',
  shareButtonCopy:         'Copy Link',
  shareButtonCopied:       'Copied!',
  shareButtonDisable:      'Stop Sharing',
  shareButtonDisableConfirm: 'Stop sharing this content? The link will stop working.',

  // Scope labels
  shareScopeFull:          'Full Lesson',
  shareScopeFullDesc:      'All 8 sections -- for substitute teacher training',
  shareScopeHandout:       'Group Handout Only',
  shareScopeHandoutDesc:   'Section 8 only -- for class members',

  // Sharing status
  sharingActive:           'Sharing active',
  sharingInactive:         'Not shared',

  // Upgrade prompt
  upgradePrompt:           'Shareable links require a Personal Plan.',
  upgradeButton:           'Upgrade to Share',

  // Toasts
  toastLinkCopied:         'Link copied to clipboard',
  toastSharingEnabled:     'Sharing enabled',
  toastSharingDisabled:    'Sharing disabled',
  toastShareError:         'Could not update sharing',

  // QR codes
  qrCodeLabel:    'QR Code',
  qrCodeDownload: 'Download QR Code',

  // Public page
  publicPageCta:           'Create your own Bible lessons at BibleLessonSpark.com',
  publicPageCtaUrl:        'https://biblelessonspark.com',
  publicPageNotFound:      'This link is no longer available.',
  publicPageNotFoundSub:   'The teacher may have stopped sharing this content.',
  publicPageLoadError:     'Could not load content. Please try again.',
};
