<template>
	<div class="nce-pathfinder-dialog flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
		:style="{ width: '480px', maxHeight: '420px' }"
	>
		<!-- Tab bar -->
		<div class="flex border-b border-gray-200 bg-gray-50">
			<button
				v-for="tab in tabs"
				:key="tab.key"
				class="flex-1 px-4 py-2 text-xs font-medium transition-colors"
				:class="
					activeTab === tab.key
						? 'border-b-2 border-blue-500 bg-white text-blue-600'
						: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
				"
				@click="activeTab = tab.key"
			>
				<div class="flex items-center justify-center gap-1.5">
					<FeatherIcon :name="tab.icon" class="h-3.5 w-3.5" />
					{{ tab.label }}
				</div>
			</button>
		</div>

		<!-- Tab content -->
		<div class="flex-1 overflow-auto">
			<!-- Field Path tab -->
			<div v-if="activeTab === 'field'" class="flex flex-col">
				<PathFinderCore
					v-if="doctype"
					ref="pathFinderCore"
					:rootDoctype="doctype"
					mode="single"
					@path-selected="handlePathSelected"
				/>
				<div v-else class="flex flex-col items-center justify-center gap-2 py-10 text-gray-400">
					<FeatherIcon name="alert-circle" class="h-6 w-6" />
					<span class="text-xs">No DocType configured</span>
				</div>
			</div>

			<!-- Button Action tab -->
			<div v-if="activeTab === 'action'" class="flex flex-col gap-2 p-3">
				<div v-if="isLoadingMethods" class="flex items-center justify-center py-8">
					<span class="text-xs text-gray-400">Loading methods…</span>
				</div>

				<div v-else-if="whitelistedMethods.length === 0" class="flex flex-col items-center justify-center gap-2 py-8 text-gray-400">
					<FeatherIcon name="slash" class="h-6 w-6" />
					<span class="text-xs">No whitelisted methods found</span>
				</div>

				<div v-else class="flex flex-col gap-1">
					<div class="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
						Whitelisted Methods
					</div>
					<button
						v-for="method in whitelistedMethods"
						:key="method"
						class="flex items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-gray-100"
						:class="{
							'bg-blue-50 text-blue-700': selectedMethod === method,
						}"
						@click="handleMethodSelect(method)"
					>
						<FeatherIcon name="play" class="h-3 w-3 flex-shrink-0 text-gray-400" />
						<code class="font-mono">{{ method }}</code>
					</button>
				</div>
			</div>
		</div>

		<!-- Footer -->
		<div
			v-if="pendingValue"
			class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-3 py-2"
		>
			<code class="max-w-[340px] truncate text-xs text-gray-600">{{ pendingValue }}</code>
			<button
				class="rounded bg-blue-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-600"
				@click="confirmSelection"
			>
				Insert
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue"
import { FeatherIcon, call } from "frappe-ui"
import PathFinderCore from "./PathFinderCore.vue"

const props = withDefaults(
	defineProps<{
		doctype: string
		modelValue?: string
	}>(),
	{
		modelValue: "",
	}
)

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void
}>()

// Tab definitions
const tabs = [
	{ key: "field" as const, label: "Field Path", icon: "link" },
	{ key: "action" as const, label: "Button Action", icon: "zap" },
]

type TabKey = "field" | "action"

const activeTab = ref<TabKey>("field")
const pathFinderCore = ref<InstanceType<typeof PathFinderCore> | null>(null)

// Pending value to be confirmed
const pendingValue = ref("")

// --- Field Path tab state ---
function handlePathSelected(path: string) {
	pendingValue.value = path
	// Immediately confirm field path selection (no extra Insert click needed)
	emit("update:modelValue", path)
}

// --- Button Action tab state ---
const whitelistedMethods = ref<string[]>([])
const isLoadingMethods = ref(false)
const selectedMethod = ref<string | null>(null)

async function fetchWhitelistedMethods() {
	if (!props.doctype) return

	isLoadingMethods.value = true
	try {
		const result = await call("pathfinder.api.get_whitelisted_methods", {
			doctype: props.doctype,
		})
		whitelistedMethods.value = result || []
	} catch {
		whitelistedMethods.value = []
	} finally {
		isLoadingMethods.value = false
	}
}

function handleMethodSelect(method: string) {
	selectedMethod.value = method
	pendingValue.value = `run_method:${method}`
}

function confirmSelection() {
	if (pendingValue.value) {
		emit("update:modelValue", pendingValue.value)
	}
}

// Initialize from current model value
watch(
	() => props.modelValue,
	(val) => {
		if (val && val.startsWith("run_method:")) {
			activeTab.value = "action"
			selectedMethod.value = val.replace("run_method:", "")
			pendingValue.value = val
		} else if (val) {
			activeTab.value = "field"
			pendingValue.value = val
		}
	},
	{ immediate: true }
)

// Fetch methods when switching to the action tab or when doctype changes
watch(activeTab, (tab) => {
	if (tab === "action" && whitelistedMethods.value.length === 0) {
		fetchWhitelistedMethods()
	}
})

watch(() => props.doctype, () => {
	whitelistedMethods.value = []
	selectedMethod.value = null
	if (activeTab.value === "action") {
		fetchWhitelistedMethods()
	}
})

onMounted(() => {
	if (activeTab.value === "action") {
		fetchWhitelistedMethods()
	}
})
</script>
