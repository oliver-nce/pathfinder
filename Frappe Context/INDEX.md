# Frappe Context — Index

> 2026-03-23 · B=Backend · U=UI · F=Framework · Scores 0–1

## Route

Read ONE sub-index based on your task, then load the chunks it recommends.

| Task involves… | Read this |
|----------------|-----------|
| ORM, DB, hooks, APIs, permissions, jobs, caching, error handling | `_idx_backend.md` |
| Vue, CSS, tokens, workspaces, icons, client JS, theming | `_idx_ui.md` |
| Frappe architecture, DocTypes, bench/CLI, deployment, testing | `_idx_framework.md` |
| Mix of backend + UI | Read both `_idx_backend.md` and `_idx_ui.md` |
| General orientation / unsure | Start with `_idx_framework.md` |

## Rules

1. Read this file first (~400 tokens)
2. Load the relevant sub-index (~1.5k tokens)
3. Load chunks the sub-index recommends (by score, highest first)
4. JSONL = deep reference from docs.frappe.io — last resort, large files

## Scope

Frappe framework only. ERPNext and other Frappe apps (HRMS, Healthcare, Education, etc.) are out of scope.
