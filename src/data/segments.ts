/**
 * One row per market segment the designer works across. `order` controls
 * display order on the landing page's segment selection — change the
 * number, not the array position, so reordering is a one-line edit.
 *
 * Phase 1 only builds out projects for the "streetwear" segment (see
 * projects.ts); the other four render as real, clickable entries that
 * lead to an empty-but-styled grid. Names are placeholders the designer
 * will refine — editing one is a one-line change here, nothing in the
 * templates needs to know about it.
 */

export interface Segment {
  id: string;
  slug: string;
  name: string;
  order: number;
  blurb: string;
}

export const segments: Segment[] = [
  {
    id: "vendor-collaboration",
    slug: "vendor-collaboration",
    name: "Vendor & Client Collaboration",
    order: 1,
    blurb: "Working inside someone else's brief — production-ready development for other labels and manufacturers.",
  },
  {
    id: "streetwear",
    slug: "streetwear",
    name: "Streetwear",
    order: 2,
    blurb: "Graphic, construction-led pieces built for repetition, durability, and a second look.",
  },
  {
    id: "evening-wear",
    slug: "evening-wear",
    name: "Evening Wear",
    order: 3,
    blurb: "Occasion dressing with couture-level finishing and a quieter hand.",
  },
  {
    id: "contemporary",
    slug: "contemporary",
    name: "Contemporary",
    order: 4,
    blurb: "Ready-to-wear that sits between the runway and the rail — wearable, considered, commercial.",
  },
  {
    id: "indo-western",
    slug: "indo-western",
    name: "Indo-Western",
    order: 5,
    blurb: "Two vocabularies in one garment — traditional craft techniques in contemporary silhouettes.",
  },
];

export function getSegmentBySlug(slug: string): Segment | undefined {
  return segments.find((segment) => segment.slug === slug);
}

export function getOrderedSegments(): Segment[] {
  return [...segments].sort((a, b) => a.order - b.order);
}
