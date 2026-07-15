// Shared anchor-passage list for the B6 theology golden suite.
// Three doctrinal stress tests (Calvinist/Arminian axis) + one neutral control.
// Approved by Lynn 2026-07-15.

export interface AnchorPassage {
  slug: string;
  reference: string;
  note: string;
}

export const ANCHOR_PASSAGES: AnchorPassage[] = [
  {
    slug: 'romans-9',
    reference: 'Romans 9:1-24',
    note: 'Election / sovereignty stress test',
  },
  {
    slug: 'hebrews-6',
    reference: 'Hebrews 6:1-12',
    note: 'Perseverance / apostasy stress test',
  },
  {
    slug: 'ephesians-2',
    reference: 'Ephesians 2:1-10',
    note: 'Grace / faith / works stress test',
  },
  {
    slug: 'psalm-23',
    reference: 'Psalm 23:1-6',
    note: 'Doctrinally neutral control -- all profiles should converge',
  },
];
