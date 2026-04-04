# Frappe Context Routing Instructions

## For the agent: how to load Frappe Context docs

You have access to `Frappe Context/fc_index.json` — a scored index of all documentation chunks.
Do NOT read the whole corpus. Route to what you need.

### Step 1: Determine axis weights (takes 0 tokens)

Based on the current task, assign weights that sum to 1.0:

| Task type | B weight | U weight | F weight |
|-----------|----------|----------|----------|
| Backend logic (ORM, hooks, API, DB) | 0.7 | 0.0 | 0.3 |
| Vue/CSS/theming work | 0.0 | 0.7 | 0.3 |
| Mixed backend + UI | 0.4 | 0.4 | 0.2 |
| New project / architecture | 0.3 | 0.2 | 0.5 |
| Unfamiliar with Frappe | 0.2 | 0.2 | 0.6 |

Interpolate for edge cases. The weights are a judgment call, not a formula.

### Step 2: Read fc_index.json and score

For each chunk, compute: `score = (B × w_b) + (U × w_u) + (F × w_f)`

Sort descending. Load from top until you hit your token budget.

### Step 3: Token budget rules

- **Tight context (<8k free):** Load top 3–5 rag-tier chunks only (~5k tokens)
- **Normal context (<32k free):** Load top 8–12 chunks, mix of rag + guide tiers (~15k tokens)
- **Deep dive (>32k free):** Load top 15+ chunks, include jsonl if needed
- **Always prefer rag/guide tier over jsonl** — jsonl files are 6–30k tokens each

### Step 4: Mandatory loads

- **Any Vue component work** → always load `theming_vue_tokens.md` regardless of score
- **Any v15/v16 question** → always load `v15_v16_compat.md`

### Scope

Frappe framework only. ERPNext modules, HRMS, Healthcare, Education etc. are out of scope for this corpus.
