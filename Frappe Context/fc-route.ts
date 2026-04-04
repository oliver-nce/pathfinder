/**
 * fc-route — Frappe Context routing tool
 *
 * Reads fc_index.json, computes weighted B/U/F scores, returns a ranked
 * list of files the agent should load. Zero tokens spent on index parsing
 * in the agent's context window.
 *
 * Usage:
 *   Agent calls fc_route with axis weights (or a task description for auto-weighting).
 *   Tool returns a ranked file list within the token budget.
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { ToolDefinition } from "../types.js";

// ── Types ─────────────────────────────────────────────────────────────

interface FcChunk {
  file: string;
  tokens: number;
  desc: string;
  b: number;
  u: number;
  f: number;
  tier: "rag" | "guide" | "standalone" | "jsonl";
}

interface FcIndex {
  version: number;
  chunks: FcChunk[];
  total_tokens: number;
}

// ── Index cache (loaded once per server lifetime) ─────────────────────

let cachedIndex: FcIndex | null = null;

function loadIndex(projectRoot: string): FcIndex {
  if (cachedIndex) return cachedIndex;

  // Search for fc_index.json in likely locations
  const candidates = [
    resolve(projectRoot, "Frappe Context", "fc_index.json"),
    resolve(projectRoot, "_Project support files", "Frappe Context", "fc_index.json"),
  ];

  // Also walk up from projectRoot to find it in a sibling _Project support files
  const parent = dirname(projectRoot);
  candidates.push(
    resolve(parent, "_Project support files", "Frappe Context", "fc_index.json"),
  );

  for (const path of candidates) {
    if (existsSync(path)) {
      const raw = readFileSync(path, "utf-8");
      cachedIndex = JSON.parse(raw) as FcIndex;
      return cachedIndex;
    }
  }

  throw new Error(
    `fc_index.json not found. Searched:\n${candidates.join("\n")}`,
  );
}

// ── Scoring ───────────────────────────────────────────────────────────

interface WeightedChunk extends FcChunk {
  score: number;
}

function rankChunks(
  chunks: FcChunk[],
  wb: number,
  wu: number,
  wf: number,
  tokenBudget: number,
  preferTiers: string[] = ["rag", "guide", "standalone", "jsonl"],
): WeightedChunk[] {
  // Compute weighted score
  const scored: WeightedChunk[] = chunks.map((c) => ({
    ...c,
    score: c.b * wb + c.u * wu + c.f * wf,
  }));

  // Sort by score desc, then by tier preference (rag first), then by tokens asc
  const tierOrder = Object.fromEntries(preferTiers.map((t, i) => [t, i]));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const tierDiff = (tierOrder[a.tier] ?? 99) - (tierOrder[b.tier] ?? 99);
    if (tierDiff !== 0) return tierDiff;
    return a.tokens - b.tokens;
  });

  // Select within budget
  const selected: WeightedChunk[] = [];
  let tokensUsed = 0;
  for (const chunk of scored) {
    if (tokensUsed + chunk.tokens > tokenBudget) {
      // Skip large chunks but keep looking for smaller ones that fit
      if (chunk.tier === "jsonl") continue;
      if (tokensUsed + chunk.tokens > tokenBudget * 1.1) continue;
    }
    selected.push(chunk);
    tokensUsed += chunk.tokens;
    if (tokensUsed >= tokenBudget) break;
  }

  return selected;
}

// ── Mandatory loads ───────────────────────────────────────────────────

const MANDATORY: Record<string, string[]> = {
  vue: ["theming_vue_tokens.md"],
  css: ["theming_css_systems.md"],
  theme: ["theming_vue_tokens.md", "theming_css_systems.md"],
  v15: ["v15_v16_compat.md"],
  v16: ["v15_v16_compat.md"],
  compat: ["v15_v16_compat.md"],
};

function getMandatoryFiles(taskDesc: string): string[] {
  const lower = taskDesc.toLowerCase();
  const files = new Set<string>();
  for (const [keyword, paths] of Object.entries(MANDATORY)) {
    if (lower.includes(keyword)) {
      paths.forEach((p) => files.add(p));
    }
  }
  return Array.from(files);
}

// ── Tool definition ───────────────────────────────────────────────────

export const tool: ToolDefinition = {
  name: "fc_route",
  description:
    "Route to the most relevant Frappe Context documents for a task. " +
    "Returns a ranked file list within a token budget. " +
    "Call this BEFORE reading any Frappe Context files.",
  inputSchema: {
    type: "object",
    properties: {
      task_description: {
        type: "string",
        description:
          "Brief description of the current task. Used to detect mandatory loads " +
          "(e.g. Vue component work always loads theming docs).",
      },
      weight_b: {
        type: "number",
        description:
          "Backend axis weight (0-1). Server-side: ORM, DB, hooks, APIs, permissions, jobs.",
      },
      weight_u: {
        type: "number",
        description:
          "UI axis weight (0-1). Frontend: Vue, CSS, tokens, workspaces, client JS.",
      },
      weight_f: {
        type: "number",
        description:
          "Framework axis weight (0-1). Frappe fundamentals: architecture, DocTypes, bench/CLI.",
      },
      token_budget: {
        type: "number",
        description:
          "Max tokens to allocate for FC context. Default: 15000. " +
          "Use ~5000 for tight contexts, ~30000 for deep dives.",
      },
      project_root: {
        type: "string",
        description:
          "Project root path. Used to locate fc_index.json in the Frappe Context folder.",
      },
    },
    required: ["task_description", "weight_b", "weight_u", "weight_f"],
  },
  handler: async (args: {
    task_description: string;
    weight_b: number;
    weight_u: number;
    weight_f: number;
    token_budget?: number;
    project_root?: string;
  }) => {
    const {
      task_description,
      weight_b: wb,
      weight_u: wu,
      weight_f: wf,
      token_budget = 15000,
      project_root = ".",
    } = args;

    try {
      const index = loadIndex(project_root);

      // Get mandatory files from task description
      const mandatoryFiles = getMandatoryFiles(task_description);

      // Rank all chunks
      const ranked = rankChunks(index.chunks, wb, wu, wf, token_budget);

      // Ensure mandatory files are included (insert at top if missing)
      const rankedFiles = new Set(ranked.map((c) => c.file));
      const mandatoryToAdd = mandatoryFiles.filter((f) => !rankedFiles.has(f));
      const mandatoryChunks = index.chunks
        .filter((c) => mandatoryToAdd.includes(c.file))
        .map((c) => ({ ...c, score: 1.0 })); // force top score

      const finalList = [...mandatoryChunks, ...ranked];

      // Build response
      const totalTokens = finalList.reduce((sum, c) => sum + c.tokens, 0);
      const fileList = finalList.map((c) => ({
        file: c.file,
        tokens: c.tokens,
        score: Math.round(c.score * 100) / 100,
        desc: c.desc,
        tier: c.tier,
        mandatory: mandatoryFiles.includes(c.file),
      }));

      return JSON.stringify(
        {
          status: "ok",
          weights: { b: wb, u: wu, f: wf },
          token_budget,
          tokens_selected: totalTokens,
          files_selected: fileList.length,
          mandatory_loaded: mandatoryFiles,
          files: fileList,
        },
        null,
        2,
      );
    } catch (error) {
      return JSON.stringify({
        status: "error",
        message: `${error}`,
      });
    }
  },
};
