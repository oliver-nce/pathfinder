<template>
	<div class="nce-path-column flex h-full w-56 flex-shrink-0 flex-col border-r border-gray-200">
		<!-- Column header -->
		<div class="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-3 py-2">
			<div class="truncate text-xs font-semibold text-gray-700">{{ doctype }}</div>
		</div>

		<!-- Loading state -->
		<div v-if="isLoading" class="flex flex-1 items-center justify-center p-4">
			<div class="text-xs text-gray-400">Loading fields…</div>
		</div>

		<!-- Error state -->
		<div v-else-if="errorMessage" class="p-3 text-xs text-red-500">
			{{ errorMessage }}
		</div>

		<!-- Fields list -->
		<div v-else class="flex-1 overflow-y-auto hide-scrollbar">
			<div
				v-for="field in displayFields"
				:key="field.fieldname"
				class="group flex cursor-pointer items-center gap-2 border-b border-gray-100 px-3 py-1.5 transition-colors"
				:class="[
					fieldRowClass(field),
					{
						'!bg-blue-50': selectedField === field.fieldname,
						'opacity-50 cursor-not-allowed': isCircularRef(field),
					},
				]"
				@click="handleFieldClick(field)"
			>
				<!-- Multi-select checkbox -->
				<input
					v-if="multiSelect"
					type="checkbox"
					class="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					:checked="selectedFields.includes(field.fieldname)"
					@click.stop="toggleMultiSelect(field)"
				/>

				<!-- Field type indicator dot -->
				<span
					class="inline-block h-2 w-2 flex-shrink-0 rounded-full"
					:class="fieldDotClass(field)"
				/>

				<!-- Field label + name -->
				<div class="min-w-0 flex-1">
					<div class="truncate text-xs font-medium text-gray-700">
						{{ field.label || field.fieldname }}
					</div>
					<div class="truncate text-[10px] text-gray-400">
						{{ field.fieldname }}
						<span class="ml-1 text-gray-300">· {{ field.fieldtype }}</span>
					</div>
				</div>

				<!-- Drill-down arrow for Link / Table fields -->
				<FeatherIcon
					v-if="isDrillable(field) && !isCircularRef(field)"
					name="chevron-right"
					class="h-3 w-3 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
				/>

				<!-- Circular reference warning -->
				<span
					v-if="isCircularRef(field)"
					class="flex-shrink-0 text-xs"
					title="Circular reference — cannot drill further"
				>⚠️</span>
			</div>

			<div v-if="displayFields.length === 0" class="p-4 text-center text-xs text-gray-400">
				No fields found
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { FeatherIcon } from "frappe-ui"
import { useFieldMeta, type FieldInfo } from "../composables/useFieldMeta"

const props = withDefaults(
	defineProps<{
		doctype: string
		selectedField?: string | null
		multiSelect?: boolean
		selectedFields?: string[]
		visitedDoctypes?: Set<string>
	}>(),
	{
		selectedField: null,
		multiSelect: false,
		selectedFields: () => [],
		visitedDoctypes: () => new Set<string>(),
	}
)

const emit = defineEmits<{
	(e: "select", field: FieldInfo): void
	(e: "toggle", field: FieldInfo): void
}>()

const { fetchDoctypeFields } = useFieldMeta()

const fields = ref<FieldInfo[]>([])
const isLoading = ref(false)
const errorMessage = ref("")

// Field type classification helpers
const LINK_TYPES = new Set(["Link"])
const TABLE_TYPES = new Set(["Table", "Table MultiSelect"])
const DYNAMIC_LINK_TYPES = new Set(["Dynamic Link"])

function isLink(field: FieldInfo): boolean {
	return LINK_TYPES.has(field.fieldtype)
}

function isTable(field: FieldInfo): boolean {
	return TABLE_TYPES.has(field.fieldtype)
}

function isDynamicLink(field: FieldInfo): boolean {
	return DYNAMIC_LINK_TYPES.has(field.fieldtype)
}

function isDrillable(field: FieldInfo): boolean {
	return (isLink(field) || isTable(field)) && !!field.options
}

function isCircularRef(field: FieldInfo): boolean {
	if (!isDrillable(field) || !field.options) return false
	return props.visitedDoctypes.has(field.options)
}

// Colour-coded row backgrounds on hover
function fieldRowClass(field: FieldInfo): string {
	if (isLink(field)) return "hover:bg-blue-50/60"
	if (isTable(field)) return "hover:bg-orange-50/60"
	if (isDynamicLink(field)) return "hover:bg-purple-50/60"
	return "hover:bg-gray-50"
}

// Colour-coded dot indicator
function fieldDotClass(field: FieldInfo): string {
	if (isLink(field)) return "bg-blue-500"
	if (isTable(field)) return "bg-orange-500"
	if (isDynamicLink(field)) return "bg-purple-500"
	return "bg-gray-400"
}

// Computed display fields — sort with drillable fields first, then alphabetically
const displayFields = ref<FieldInfo[]>([])

function sortFields(raw: FieldInfo[]): FieldInfo[] {
	return [...raw].sort((a, b) => {
		const aDrill = isDrillable(a) ? 0 : 1
		const bDrill = isDrillable(b) ? 0 : 1
		if (aDrill !== bDrill) return aDrill - bDrill
		return (a.label || a.fieldname).localeCompare(b.label || b.fieldname)
	})
}

// Fetch fields via the shared cached composable
async function fetchFields() {
	if (!props.doctype) return

	isLoading.value = true
	errorMessage.value = ""
	try {
		const result = await fetchDoctypeFields(props.doctype)
		fields.value = result
		displayFields.value = sortFields(fields.value)
	} catch (err: any) {
		errorMessage.value = err?.message || "Failed to load fields"
		fields.value = []
		displayFields.value = []
	} finally {
		isLoading.value = false
	}
}

function handleFieldClick(field: FieldInfo) {
	if (isCircularRef(field)) return
	emit("select", field)
}

function toggleMultiSelect(field: FieldInfo) {
	emit("toggle", field)
}

onMounted(fetchFields)
watch(() => props.doctype, fetchFields)
</script>
