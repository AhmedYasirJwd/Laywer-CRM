import { promises as fs } from "fs";
import path from "path";
import type { LawActMeta, LawActDetail } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "major-acts");

export async function getLawActs(): Promise<LawActMeta[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "index.json"), "utf-8");
  return JSON.parse(raw) as LawActMeta[];
}

export async function getLawActBySlug(slug: string): Promise<LawActDetail | undefined> {
  const acts = await getLawActs();
  const meta = acts.find((a) => a.slug === slug);
  if (!meta) return undefined;
  if (!meta.hasIndex) return { ...meta, sections: [] };

  // The section-index files are hand-curated data, not generated — fall back
  // to "no section index" (the viewer still offers the full PDF) instead of
  // crashing the page if one is missing, malformed, or shaped unexpectedly.
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${slug}.json`), "utf-8");
    const sections = JSON.parse(raw);
    if (!Array.isArray(sections)) {
      console.error(`Major act "${slug}": expected an array of sections, got ${typeof sections}`);
      return { ...meta, hasIndex: false, sections: [] };
    }
    return { ...meta, sections };
  } catch (err) {
    console.error(`Major act "${slug}": failed to load section index`, err);
    return { ...meta, hasIndex: false, sections: [] };
  }
}

export function pdfUrlForAct(pdfFile: string): string {
  return `/major-acts-pdfs/${encodeURIComponent(pdfFile)}`;
}
