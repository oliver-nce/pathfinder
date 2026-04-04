/**
 * Shared composable for fetching DocType field metadata with an in-memory cache.
 *
 * Repointed from NCE Studio's studio.api to pathfinder.api.
 */

import { call } from "frappe-ui"

interface FieldInfo {
	fieldname: string
	fieldtype: string
	label: string
	options?: string
	reqd?: boolean
	description?: string
	[key: string]: any
}

// Module-level cache: doctype → field list (shared across all component instances)
const _cache = new Map<string, FieldInfo[]>()
// Track in-flight requests to avoid duplicate concurrent calls for the same doctype
const _pending = new Map<string, Promise<FieldInfo[]>>()

/**
 * Fetch field metadata for a DocType, returning cached results when available.
 */
async function fetchDoctypeFields(doctype: string): Promise<FieldInfo[]> {
	if (!doctype) return []

	// Return from cache if available
	if (_cache.has(doctype)) {
		return _cache.get(doctype)!
	}

	// If a request is already in flight for this doctype, await it
	if (_pending.has(doctype)) {
		return _pending.get(doctype)!
	}

	// Make the API call and cache the result
	const promise = call("pathfinder.api.get_doctype_fields", { doctype })
		.then((result: FieldInfo[]) => {
			const fields = result || []
			_cache.set(doctype, fields)
			_pending.delete(doctype)
			return fields
		})
		.catch(() => {
			_pending.delete(doctype)
			return [] as FieldInfo[]
		})

	_pending.set(doctype, promise)
	return promise
}

/**
 * Find a specific field by fieldname within a DocType's metadata.
 */
async function findField(
	doctype: string,
	fieldname: string,
): Promise<FieldInfo | null> {
	const fields = await fetchDoctypeFields(doctype)
	return fields.find((f) => f.fieldname === fieldname) || null
}

/**
 * Resolve field metadata for a dot-notation path (e.g. "customer.address.city")
 * by traversing through link-type fields to find the terminal field's metadata.
 */
async function resolveNestedFieldMeta(
	rootDoctype: string,
	fieldPath: string,
): Promise<FieldInfo | null> {
	if (!rootDoctype || !fieldPath) return null

	const segments = fieldPath.split(".")
	let currentDoctype = rootDoctype

	for (let i = 0; i < segments.length; i++) {
		const field = await findField(currentDoctype, segments[i])
		if (!field) return null

		if (i === segments.length - 1) {
			// Terminal segment — return this field's metadata
			return field
		}

		// Intermediate segment — must be a Link to traverse further
		if (field.fieldtype === "Link" && field.options) {
			currentDoctype = field.options
		} else {
			return null
		}
	}

	return null
}

/**
 * Invalidate the cache for a specific doctype, or clear the entire cache.
 */
function invalidateCache(doctype?: string): void {
	if (doctype) {
		_cache.delete(doctype)
	} else {
		_cache.clear()
	}
}

export function useFieldMeta() {
	return {
		fetchDoctypeFields,
		findField,
		resolveNestedFieldMeta,
		invalidateCache,
	}
}

export type { FieldInfo }
