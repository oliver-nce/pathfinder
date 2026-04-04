<template>
	<div class="nce-pathfinder-core flex flex-col gap-2">
		<!-- Breadcrumb trail -->
		<div class="flex flex-wrap items-center gap-1 px-2 py-1 text-xs text-gray-500" v-if="columns.length > 0">
			<span
				v-for="(col, idx) in columns"
				:key="idx"
				class="flex items-center gap-1"
			>
				<span v-if="idx > 0" class="text-gray-300">/</span>
				<button
					class="rounded px-1 py-0.5 hover:bg-gray-100 hover:text-gray-700"
					:class="{ 'font-semibold text-gray-700': idx === columns.length - 1 }"
					@click="truncateToColumn(idx)"
				>
					{{ col.selectedLabel || col.doctype }}
				</button>
			</span>
		</div>

		<!-- Current path display -->
		<div
			v-if="currentPath"
			class="mx-2 flex items-center gap-2 rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-xs"
		>
			<FeatherIcon name="link" class="h-3 w-3 text-blue-500" />
			<code class="flex-1 font-mono text-blue-700">{{ currentPath }}</code>
			<button
				class="rounded p-0.5 text-blue-400 hover:bg-blue-100 hover:text-blue-600"
				@click="emitPath"
				title="Select this path"
			>
				<FeatherIcon name="check" class="h-3.5 w-3.5" />
			</button>
		</div>

		<!-- Columns container -->
		<div
			ref="columnsContainer"
			class="nce-pathfinder-columns flex flex-row overflow-x-auto hide-scrollbar"
			:style="{ minHeight: '280px' }"
		>
			<PathColumn
				v-for="(col, idx) in columns"
				:key="`${col.doctype}-${idx}`"
				:doctype="col.doctype"
				:selectedField="col.selectedField"
				:multiSelect="mode === 'multi'"
				:selectedFields="col.selectedFields"
				:visitedDoctypes="visitedDoctypes"
				class="min-w-[200px] max-w-[240px] flex-shrink-0 border-r border-gray-100"
				@select="(field) => handleFieldSelect(idx, field)"
			/>
		</div>

		<!-- Empty state -->
		<div
			v-if="columns.length === 0"
			class="flex flex-col items-center justify-center gap-2 py-10 text-gray-400"
		>
			<FeatherIcon name="compass" class="h-8 w-8" />
			<span class="text-sm">Select a DocType to start navigating</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue"
import { FeatherIcon } from "frappe-ui"
import PathColumn from "./PathColumn.vue"

interface ColumnState {
	doctype: string
	selectedField: string | null
	selectedLabel: string | null
	selectedFields: string[]
}

interface FieldSelectPayload {
	fieldname: string
	fieldtype: string
	label: string
	options?: string
}

const props = withDefaults(
	defineProps<{
		rootDoctype: string
		mode?: "single" | "multi"
	}>(),
	{
		mode: "single",
	}
)

const emit = defineEmits<{
	(e: "path-selected", path: string): void
	(e: "update:modelValue", path: string): void
}>()

const columns = ref<ColumnState[]>([])
const columnsContainer = ref<HTMLElement | null>(null)

// Track visited doctypes for circular-reference detection
const visitedDoctypes = computed(() => {
	const visited = new Set<string>()
	for (const col of columns.value) {
		visited.add(col.doctype)
	}
	return visited
})

// Build the dot-notation path from selected fields across columns
const currentPath = computed(() => {
	const parts: string[] = []
	for (const col of columns.value) {
		if (col.selectedField) {
			parts.push(col.selectedField)
		}
	}
	return parts.join(".")
})

// Link/Table field types that allow drill-down
const DRILLABLE_TYPES = new Set(["Link", "Table", "Table MultiSelect", "Dynamic Link"])

// Initialize with root DocType
watch(
	() => props.rootDoctype,
	(dt) => {
		columns.value = []
		if (dt) {
			columns.value.push({
				doctype: dt,
				selectedField: null,
				selectedLabel: null,
				selectedFields: [],
			})
		}
	},
	{ immediate: true }
)

function handleFieldSelect(columnIndex: number, field: FieldSelectPayload) {
	const col = columns.value[columnIndex]
	if (!col) return

	// Update the selected field on this column
	col.selectedField = field.fieldname
	col.selectedLabel = field.label

	// Handle multi-select mode
	if (props.mode === "multi") {
		const idx = col.selectedFields.indexOf(field.fieldname)
		if (idx >= 0) {
			col.selectedFields.splice(idx, 1)
		} else {
			col.selectedFields.push(field.fieldname)
		}
	}

	// Truncate any columns after this one
	columns.value = columns.value.slice(0, columnIndex + 1)

	// If this is a drillable field, open a new column for the linked DocType
	if (DRILLABLE_TYPES.has(field.fieldtype) && field.options) {
		// Check for circular reference — allow viewing but warn
		const targetDoctype = field.options

		columns.value.push({
			doctype: targetDoctype,
			selectedField: null,
			selectedLabel: null,
			selectedFields: [],
		})

		// Scroll to the new column
		nextTick(() => {
			if (columnsContainer.value) {
				columnsContainer.value.scrollLeft = columnsContainer.value.scrollWidth
			}
		})
	} else {
		// Terminal field selected — emit the path
		emitPath()
	}
}

function emitPath() {
	if (currentPath.value) {
		emit("path-selected", currentPath.value)
		emit("update:modelValue", currentPath.value)
	}
}

function truncateToColumn(index: number) {
	if (index < columns.value.length - 1) {
		// Clear selection on the target column and remove everything after
		columns.value[index].selectedField = null
		columns.value[index].selectedLabel = null
		columns.value = columns.value.slice(0, index + 1)
	}
}

// Expose for parent components
defineExpose({
	currentPath,
	columns,
})
</script>

<style scoped>
.nce-pathfinder-columns {
	scroll-behavior: smooth;
}
</style>
