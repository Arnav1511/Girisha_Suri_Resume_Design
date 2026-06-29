/**
 * One row per project. Drop real photography in by changing the image
 * paths below — nothing in the page templates needs to change. Paths
 * starting with /images/ resolve from public/images/ (see README).
 *
 * `protected: true` projects get a full case-study page like any other —
 * only the hero image is gated (see [project].astro and ProjectCard.astro).
 * Their `heroImage` MUST point at a genuinely low-res, blurred,
 * separately-exported file (see public/images/streetwear/overrun-bomber/
 * hero-blurred.jpg — generated from the real photo via sharp: resize to a
 * few dozen px, blur, re-export — never the real asset with a CSS blur on
 * top). The
 * real source file lives outside public/ entirely (/private/protected-images,
 * gitignored) and only reaches the public build as a hashed filename — see
 * scripts/prepare-protected-assets.mjs and src/lib/clientGate.ts. Process
 * and lookbook images for a protected project are ordinary public files —
 * only the final reveal shot is treated as sensitive.
 */

export type ProcessSectionType = "research" | "inspiration" | "mood" | "mock" | "techpack" | "lookbook";

export interface ProcessSection {
  type: ProcessSectionType;
  heading: string;
  body: string;
  images: string[];
  /** Which bespoke scroll interaction (if any) lives in this section. */
  interactive?: "thread-embroidery" | "measure-scale" | null;
  alt: string[];
}

export interface Project {
  id: string;
  slug: string;
  segmentId: string;
  title: string;
  client?: string;
  year?: number;
  heroImage: string;
  heroAlt: string;
  protected: boolean;
  /** Shown on hover/under the card. Keep to 30 words or fewer. */
  description: string;
  /** Techniques, garment type, aesthetic — drives the recruiter filter. */
  tags: string[];
  process: ProcessSection[];
  lookbookImages: string[];
  lookbookAlt: string[];
}

export const projects: Project[] = [
  {
    id: "selvedge-static",
    slug: "selvedge-static",
    segmentId: "streetwear",
    title: "Selvedge Static",
    year: 2024,
    heroImage: "/images/streetwear/selvedge-static/hero.svg",
    heroAlt: "Raw indigo selvedge jacket, back view, with a static-pattern embroidered panel across the yoke.",
    protected: false,
    description:
      "A heavyweight selvedge jacket built around one hand-embroidered panel — radio static rendered in thread across raw indigo.",
    tags: ["outerwear", "hand embroidery", "selvedge denim", "streetwear", "graphic devices"],
    process: [
      {
        type: "research",
        heading: "Research",
        body: "Started from decommissioned workwear — chore coats and rail jackets built for abrasion, not occasion. The brief to myself: keep the construction honest, let the surface carry the idea.",
        images: ["/images/streetwear/selvedge-static/research.svg"],
        alt: ["Reference tear sheet of archival workwear jackets and raw denim swatches pinned to a board."],
      },
      {
        type: "inspiration",
        heading: "Inspiration",
        body: "Off-air television static and AM radio interference — visual noise as a textile motif. The idea was to translate something digital and accidental into something stitched and deliberate.",
        images: ["/images/streetwear/selvedge-static/inspiration.svg"],
        alt: ["Mood reference grid pairing television static stills with woven texture close-ups."],
      },
      {
        type: "mood",
        heading: "Mood",
        body: "Indigo, bone, and a single thread of rust. Cold construction, warm surface — the embroidery is the only part of this jacket allowed to feel handmade.",
        images: ["/images/streetwear/selvedge-static/mood.svg"],
        alt: ["Mood board with indigo denim swatch, bone cotton thread, and rust embroidery floss."],
      },
      {
        type: "mock",
        heading: "Embroidery mock",
        body: "The static pattern digitised into a stitch path, then run by hand across a test panel before it touched the real yoke. This is the moment the idea either holds together or it doesn't.",
        images: ["/images/streetwear/selvedge-static/mock-embroidery.svg"],
        interactive: "thread-embroidery",
        alt: ["Close-up test panel of the static-pattern hand embroidery mid-stitch on indigo denim."],
      },
      {
        type: "techpack",
        heading: "Tech pack",
        body: "Panel-by-panel construction notes: 12mm seam allowance throughout, chainstitched hem, embroidery placement gridded off the yoke seam so it repeats true across sizes.",
        images: ["/images/streetwear/selvedge-static/techpack.svg"],
        alt: ["Technical flat sketch of the jacket with construction and stitch-placement annotations."],
      },
    ],
    lookbookImages: [
      "/images/streetwear/selvedge-static/lookbook-1.svg",
      "/images/streetwear/selvedge-static/lookbook-2.svg",
      "/images/streetwear/selvedge-static/lookbook-3.svg",
    ],
    lookbookAlt: [
      "Lookbook image of the finished jacket worn, three-quarter front view.",
      "Lookbook detail shot of the embroidered yoke panel in daylight.",
      "Lookbook image of the jacket laid flat, full back view.",
    ],
  },
  {
    id: "overrun-bomber",
    slug: "overrun-bomber",
    segmentId: "streetwear",
    title: "Overrun Bomber",
    year: 2025,
    heroImage: "/images/streetwear/overrun-bomber/hero-blurred.jpg",
    heroAlt: "Low-resolution preview of an unreleased bomber jacket, blurred pending client release.",
    protected: true,
    description:
      "An unreleased bomber developed for a commercial client. Construction and finish detail available on request while the release stays under wraps.",
    tags: ["outerwear", "bomber", "commercial development", "unreleased", "technical outerwear"],
    process: [
      {
        type: "research",
        heading: "Research",
        body: "The brief came in against an existing factory pattern block — a flight-jacket silhouette the client already had tooled up. The job was reconciling that constraint with a sharper, more current proportion without triggering a re-grade across their full size run.",
        images: ["/images/streetwear/overrun-bomber/research.svg"],
        alt: ["Reference tear sheet of flight-jacket archetypes annotated against the client's existing pattern block."],
      },
      {
        type: "inspiration",
        heading: "Inspiration",
        body: "Vintage flight and field jackets for proportion, modern technical outerwear for the hardware — zip pulls, rib-knit trims, placement of the chest pocket. The client wanted nostalgic shape with current-season detailing.",
        images: ["/images/streetwear/overrun-bomber/inspiration.svg"],
        alt: ["Mood reference grid pairing archival flight jackets with current technical-outerwear hardware."],
      },
      {
        type: "mood",
        heading: "Mood",
        body: "Ripstop nylon in the client's seasonal colourway, contrast rib at the collar and cuff, tonal topstitching rather than a contrast thread — quiet branding, no logo on the body.",
        images: ["/images/streetwear/overrun-bomber/mood.svg"],
        alt: ["Mood board with ripstop nylon swatch, rib-knit trim, and tonal topstitching thread."],
      },
      {
        type: "mock",
        heading: "Fit mock",
        body: "First sample against the client's existing block, graded proportion checked across three sizes before committing to bulk. This is the stage that decides whether the brief's two constraints — nostalgic shape, no re-grade — actually hold together.",
        images: ["/images/streetwear/overrun-bomber/mock.svg"],
        alt: ["Fit sample of the bomber on a form, pinned for proportion adjustment."],
      },
      {
        type: "techpack",
        heading: "Tech pack",
        body: "Full construction spec handed to the client's production floor: seam allowances, trim sourcing, placement grid for the chest pocket, and grading notes carried over from the original block.",
        images: ["/images/streetwear/overrun-bomber/techpack.svg"],
        alt: ["Technical flat sketch of the bomber with construction and trim-placement annotations."],
      },
    ],
    lookbookImages: [
      "/images/streetwear/overrun-bomber/lookbook-1.svg",
      "/images/streetwear/overrun-bomber/lookbook-2.svg",
      "/images/streetwear/overrun-bomber/lookbook-3.svg",
    ],
    lookbookAlt: [
      "Lookbook image of the finished bomber worn, three-quarter front view.",
      "Lookbook detail shot of the collar and zip hardware.",
      "Lookbook image of the bomber laid flat, full back view.",
    ],
  },
];

export function getProjectsBySegment(segmentId: string): Project[] {
  return projects.filter((project) => project.segmentId === segmentId);
}

export function getProjectBySlug(segmentId: string, slug: string): Project | undefined {
  return projects.find((project) => project.segmentId === segmentId && project.slug === slug);
}
