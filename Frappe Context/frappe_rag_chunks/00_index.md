# Frappe Framework RAG Documentation Index

This collection of markdown documents is designed for Retrieval Augmented Generation (RAG) systems. Each document is self-contained with overlapping content at topic boundaries to ensure context is preserved during retrieval.

## Document Structure

Each chunk follows these principles:
- **Self-contained topics** - Each document covers a specific area
- **Overlapping content** - Related topics have shared code blocks and concepts
- **Complete code blocks** - No code is split across documents
- **Consistent formatting** - Headers, code fences, and examples are standardized

## Chunk Listing

| File | Topic | Key Concepts |
|------|-------|--------------|
| 01_introduction_core_concepts.md | Introduction & Core Concepts | `import frappe`, bench console, context initialization |
| 02_database_operations_basic.md | Database Operations (Basic) | `frappe.db`, get_value, set_value, SQL queries |
| 03_database_operations_advanced.md | Database Operations (Advanced) | Bulk operations, Query Builder, schema operations |
| 04_document_orm_basic.md | Document ORM (Basic) | `frappe.get_doc`, `frappe.new_doc`, CRUD operations |
| 05_document_orm_advanced.md | Document ORM (Advanced) | Child tables, copy, rename, submit/cancel |
| 06_query_helpers.md | Query Helpers | `frappe.get_all`, `frappe.get_list`, filters, pagination |
| 07_users_permissions.md | Users & Permissions | Session, roles, permissions, sharing |
| 08_cache_operations.md | Cache Operations | Redis cache, hash/list/set operations |
| 09_files_attachments.md | Files & Attachments | File upload, download, attachments |
| 10_email_notifications.md | Email & Notifications | sendmail, templates, notifications |
| 11_background_jobs.md | Background Jobs & Queues | `frappe.enqueue`, scheduler, RQ |
| 12_utilities_datetime.md | Utilities: Date & Time | Date arithmetic, formatting, comparison |
| 13_utilities_numbers_strings.md | Utilities: Numbers & Strings | flt, cint, formatting, validation |
| 14_custom_fields_property_setters.md | Custom Fields & Property Setters | Adding fields, modifying properties |
| 15_doctype_meta_schema.md | DocType Meta & Schema | Meta information, field definitions |
| 16_hooks_document_events.md | Hooks & Document Events | Controller methods, hooks.py |
| 17_api_whitelisted_methods.md | API & Whitelisted Methods | REST API, `@frappe.whitelist()` |
| 18_logging_error_handling.md | Logging & Error Handling | Logging, exceptions, messages |
| 19_site_configuration.md | Site Configuration | site_config.json, system settings |
| 20_bench_cli_commands.md | Bench CLI Commands | bench commands reference |

## Overlap Map

Documents with shared/overlapping content:

```
01 ←→ 02 (frappe context)
02 ←→ 03 (transactions, SQL)
04 ←→ 05 (document methods)
04 ←→ 06 (get_doc vs get_all)
07 ←→ 17 (permissions in API)
10 ←→ 11 (email queue)
12 ←→ 13 (frappe.utils)
14 ←→ 15 (DocType structure)
16 ←→ 17 (whitelisted methods)
19 ←→ 20 (bench config)
```

## Usage Notes for RAG

1. **Chunk Size**: Each document is approximately 3000-5000 tokens
2. **Retrieval**: Use semantic search on document content
3. **Context Window**: 2-3 related chunks should fit most context windows
4. **Code Blocks**: All code blocks are complete and runnable
5. **Cross-references**: Some topics reference other documents - consider multi-chunk retrieval

## Recommended Embedding Strategy

- Embed each document as a single chunk
- For finer granularity, split on `## ` headers but keep code blocks intact
- Include filename in metadata for source attribution
