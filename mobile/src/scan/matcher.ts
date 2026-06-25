/**
 * Module 4: on-device metadata extraction + Smart Renamer, and Module 3-D smart
 * clustering. This is the local heuristic layer; server-side AI (summaries/key
 * terms) is a separate seam. Wrong guesses are surfaced as editable suggestions
 * with a confidence hint, never silently applied (Reality Check).
 */

export interface ExtractedMeta {
  courseCode: string | null;
  week: number | null;
  topic: string | null;
  /** 0..1 — drives the "confidence hint" the UI must show. */
  confidence: number;
  keyTerms: string[];
}

const COURSE_RE = /\b([A-Z]{2,4})[\s_-]?(\d{2,3})\b/;
const WEEK_RE = /\b(?:week|wk|w)[\s_-]?(\d{1,2})\b/i;
const LECTURE_RE = /\b(?:lecture|lec|l)[\s_-]?(\d{1,2})\b/i;

const STOP = new Set([
  "the","a","an","and","or","of","to","in","for","on","with","pdf","pptx",
  "docx","doc","final","draft","copy","new","week","lecture","notes","slides",
]);

/** Parse course/week/topic from a (chaotic) filename. */
export function extractMeta(filename: string): ExtractedMeta {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  let confidence = 0.2;

  const courseMatch = base.match(COURSE_RE);
  const courseCode = courseMatch
    ? `${courseMatch[1].toUpperCase()}${courseMatch[2]}`
    : null;
  if (courseCode) confidence += 0.4;

  const weekMatch = base.match(WEEK_RE) ?? base.match(LECTURE_RE);
  const week = weekMatch ? Number(weekMatch[1]) : null;
  if (week != null) confidence += 0.25;

  const keyTerms = tokenize(base);
  // Topic = the first 2-3 meaningful tokens that aren't the course/week markers.
  const topicTokens = keyTerms
    .filter((t) => t !== courseCode?.toLowerCase())
    .slice(0, 3);
  const topic = topicTokens.length
    ? topicTokens.map(cap).join(" ")
    : null;
  if (topic) confidence += 0.1;

  return {
    courseCode,
    week,
    topic,
    confidence: Math.min(confidence, 0.99),
    keyTerms,
  };
}

/** Smart Renamer: {COURSE}_{WEEK}_{TOPIC}, falling back gracefully. */
export function smartRename(meta: ExtractedMeta, original: string): string {
  const parts: string[] = [];
  if (meta.courseCode) parts.push(meta.courseCode);
  if (meta.week != null) parts.push(`W${String(meta.week).padStart(2, "0")}`);
  if (meta.topic) parts.push(meta.topic.replace(/\s+/g, ""));
  const ext = original.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
  return parts.length ? parts.join("_") + ext : original;
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP.has(t) && !/^\d+$/.test(t));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Smart clustering (Module 3-D): TF-IDF over filenames to group "Uncategorized"
// files that share vocabulary but have no recognizable course code.
// ---------------------------------------------------------------------------

export interface ClusterInput {
  id: string;
  filename: string;
}
export interface Cluster {
  label: string;
  keywords: string[];
  memberIds: string[];
}

/**
 * Lightweight clustering: group by the strongest shared TF-IDF term. Files with
 * a course code are excluded (they go to official folders). Returns clusters of
 * >=2 files; singletons stay in "Unsorted".
 */
export function clusterUncategorized(items: ClusterInput[]): {
  clusters: Cluster[];
  unsortedIds: string[];
} {
  const docs = items
    .filter((it) => !COURSE_RE.test(it.filename))
    .map((it) => ({ id: it.id, terms: tokenize(it.filename.replace(/\.[a-z0-9]+$/i, "")) }));

  // Document frequency
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const t of new Set(d.terms)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = docs.length || 1;

  // For each doc, the top TF-IDF term.
  const byTopTerm = new Map<string, string[]>();
  const unsorted: string[] = [];
  for (const d of docs) {
    let best = "";
    let bestScore = 0;
    const tf = new Map<string, number>();
    for (const t of d.terms) tf.set(t, (tf.get(t) ?? 0) + 1);
    for (const [t, f] of tf) {
      const idf = Math.log(N / (df.get(t) ?? 1));
      const score = f * idf;
      // a term shared by >=2 docs is what makes a cluster
      if ((df.get(t) ?? 0) >= 2 && score >= bestScore) {
        bestScore = score;
        best = t;
      }
    }
    if (best) {
      const arr = byTopTerm.get(best) ?? [];
      arr.push(d.id);
      byTopTerm.set(best, arr);
    } else {
      unsorted.push(d.id);
    }
  }

  const clusters: Cluster[] = [];
  for (const [term, ids] of byTopTerm) {
    if (ids.length >= 2) {
      clusters.push({
        label: `Uncategorized - ${cap(term)}`,
        keywords: [term],
        memberIds: ids,
      });
    } else {
      unsorted.push(...ids);
    }
  }
  return { clusters, unsortedIds: unsorted };
}
