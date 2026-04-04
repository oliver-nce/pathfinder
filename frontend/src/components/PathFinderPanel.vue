<template>
	<div class="pathfinder-panel flex flex-col gap-2">
		<!-- DocType selector -->
		<div class="flex items-center gap-2 px-2 py-1.5">
			<label class="text-xs font-medium text-gray-600">DocType:</label>
			<input
				v-model="localDoctype"
				class="flex-1 rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				@change="onDoctypeChange"
				placeholder="Enter DocType"
			/>
		</div>

		<!-- Navigation -->
		<PathFinderCore
			v-if="activeDoctype"
			:rootDoctype="activeDoctype"
			:mode="mode"
			@path-selected="onPathSelected"
		/>

		<!-- Footer: emits selection for consuming apps -->
		<div
			v-if="selectedPath"
			class="flex flex-col gap-1 rounded border border-green-200 bg-green-50 px-2 py-2 text-xs"
		>
			<code class="font-mono text-green-700">{{ selectedPath }}</code>
			<div class="flex gap-2">
				<button
					class="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
					@click="emit('path-selected', selectedPath)"
				>
					Use Frappe Path
				</button>
				<button
					class="rounded bg-orange-500 px-2 py-1 text-xs text-white hover:bg-orange-600"
					@click="emit('jinja-tag-selected', selectedJinja)"
				>
					Use Jinja Tag
				</button>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import PathFinderCore from "./PathFinderCore.vue"

const props = withDefaults(
	defineProps<{
		rootDoctype?: string
		mode?: "select" | "manage"
	}>(),
	{
		rootDoctype: "",
		mode: "select",
	}
)

const emit = defineEmits<{
	(e: "path-selected", path: string): void
	(e: "jinja-tag-selected", tag: string): void
	(e: "virtual-field-created", definition: object): void
}>()

const localDoctype = ref(props.rootDoctype)
const activeDoctype = ref(props.rootDoctype)
const selectedPath = ref("")

// Build Jinja tag from selected path
const selectedJinja = computed(() => {
	if (!selectedPath.value) return ""
	return `{{ doc.${selectedPath.value} }}`
})

function onDoctypeChange() {
	activeDoctype.value = localDoctype.value
	selectedPath.value = ""
}

function onPathSelected(path: string) {
	selectedPath.value = path
}

watch(
	() => props.rootDoctype,
	(val) => {
		localDoctype.value = val
		activeDoctype.value = val
		selectedPath.value = ""
	}
)
</script>
