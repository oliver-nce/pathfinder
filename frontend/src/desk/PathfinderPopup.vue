<template>
	<div class="pathfinder-popup-overlay" @click.self="handleOverlayClick">
		<div class="pathfinder-popup">
			<!-- Header -->
			<div class="popup-header">
				<div class="popup-title">
					<FeatherIcon name="compass" class="h-4 w-4" />
					<span>Pathfinder</span>
					<span class="popup-doctype">{{ rootDoctype }}</span>
				</div>
				<button class="popup-close" @click="close">
					<FeatherIcon name="x" class="h-4 w-4" />
				</button>
			</div>

			<!-- Navigation area -->
			<div v-if="!selectedPath" class="popup-body">
				<PathFinderCore
					v-if="rootDoctype"
					:rootDoctype="rootDoctype"
					mode="single"
					@path-selected="onPathSelected"
				/>
			</div>

			<!-- 3-option output dialog -->
			<div v-else class="popup-body popup-output">
				<div class="output-path">
					<FeatherIcon name="check-circle" class="h-5 w-5 text-green-500" />
					<code>{{ selectedPath }}</code>
				</div>

				<div class="output-options">
					<button class="option-btn" @click="copyJinjaTag">
						<div class="option-icon">
							<FeatherIcon name="tag" class="h-5 w-5" />
						</div>
						<div class="option-label">
							<span class="option-title">Copy Jinja Tag</span>
							<span class="option-desc">Clipboard: {{ jinjaTag }}</span>
						</div>
					</button>

					<button class="option-btn" @click="createVirtualField">
						<div class="option-icon">
							<FeatherIcon name="plus-circle" class="h-5 w-5" />
						</div>
						<div class="option-label">
							<span class="option-title">Create Virtual Field</span>
							<span class="option-desc">Save as reusable definition</span>
						</div>
					</button>

					<button class="option-btn" @click="copyFrappePath">
						<div class="option-icon">
							<FeatherIcon name="file-text" class="h-5 w-5" />
						</div>
						<div class="option-label">
							<span class="option-title">Copy Frappe Path</span>
							<span class="option-desc">Clipboard: {{ selectedPath }}</span>
						</div>
					</button>
				</div>

				<button class="btn-back" @click="resetSelection">
					<FeatherIcon name="arrow-left" class="h-3.5 w-3.5" />
					Navigate a different path
				</button>
			</div>

			<!-- Virtual field creation sub-dialog -->
			<div v-if="showVfForm" class="popup-body popup-vf-form">
				<div class="vf-form-header">
					<FeatherIcon name="edit-3" class="h-4 w-4" />
					<span>Create Virtual Field</span>
				</div>
				<div class="vf-form">
					<div class="vf-field">
						<label>Label</label>
						<input v-model="vfForm.field_label" class="vf-input" placeholder="e.g. Customer Territory" />
					</div>
					<div class="vf-field">
						<label>Description</label>
						<input v-model="vfForm.description" class="vf-input" placeholder="Optional help text" />
					</div>
					<div class="vf-row">
						<label class="vf-check">
							<input type="checkbox" v-model="vfForm.show_in_form" />
							Show in Form
						</label>
						<label class="vf-check">
							<input type="checkbox" v-model="vfForm.show_in_list" />
							Show in List
						</label>
					</div>
					<div class="vf-actions">
						<button class="vf-btn vf-btn-secondary" @click="showVfForm = false">Cancel</button>
						<button class="vf-btn vf-btn-primary" @click="submitVirtualField" :disabled="!vfForm.field_label.trim()">Save</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import { FeatherIcon, call } from "frappe-ui"
import PathFinderCore from "../components/PathFinderCore.vue"

const props = defineProps<{
	rootDoctype: string
}>()

const emit = defineEmits<{
	(e: "close"): void
	(e: "path-selected", path: string): void
	(e: "jinja-tag-selected", tag: string): void
	(e: "virtual-field-created", data: Record<string, unknown>): void
}>()

const selectedPath = ref("")
const showVfForm = ref(false)

const vfForm = ref({
	field_label: "",
	description: "",
	show_in_form: true,
	show_in_list: false,
})

const jinjaTag = computed(() => {
	if (!selectedPath.value) return ""
	return `{{ doc.${selectedPath.value} }}`
})

function onPathSelected(path: string) {
	selectedPath.value = path
}

function resetSelection() {
	selectedPath.value = ""
	showVfForm.value = false
}

function close() {
	emit("close")
}

function handleOverlayClick() {
	close()
}

// --- Option 1: Copy Jinja Tag ---
async function copyJinjaTag() {
	if (!jinjaTag.value) return
	try {
		await navigator.clipboard.writeText(jinjaTag.value)
		if (window.frappe?.show_alert) {
			window.frappe.show_alert({ message: "Jinja tag copied to clipboard", indicator: "green" }, 3)
		}
	} catch {
		// Fallback for older browsers
		const ta = document.createElement("textarea")
		ta.value = jinjaTag.value
		document.body.appendChild(ta)
		ta.select()
		document.execCommand("copy")
		document.body.removeChild(ta)
	}
	emit("jinja-tag-selected", jinjaTag.value)
}

// --- Option 2: Create Virtual Field ---
function createVirtualField() {
	vfForm.value.field_label = ""
	vfForm.value.description = ""
	vfForm.value.show_in_form = true
	vfForm.value.show_in_list = false
	showVfForm.value = true
}

async function submitVirtualField() {
	if (!vfForm.value.field_label.trim()) return

	try {
		const result = await call("pathfinder.api.create_virtual_field", {
			source_doctype: props.rootDoctype,
			field_label: vfForm.value.field_label,
			field_path: selectedPath.value,
			description: vfForm.value.description,
			show_in_form: vfForm.value.show_in_form ? 1 : 0,
			show_in_list: vfForm.value.show_in_list ? 1 : 0,
		})
		showVfForm.value = false
		if (window.frappe?.show_alert) {
			window.frappe.show_alert({ message: `Virtual field "${result.field_label}" created`, indicator: "green" }, 3)
		}
		emit("virtual-field-created", result)
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Failed to create virtual field"
		if (window.frappe?.msgprint) {
			window.frappe.msgprint(msg)
		}
	}
}

// --- Option 3: Copy Frappe Path ---
async function copyFrappePath() {
	if (!selectedPath.value) return
	try {
		await navigator.clipboard.writeText(selectedPath.value)
		if (window.frappe?.show_alert) {
			window.frappe.show_alert({ message: "Frappe path copied to clipboard", indicator: "green" }, 3)
		}
	} catch {
		const ta = document.createElement("textarea")
		ta.value = selectedPath.value
		document.body.appendChild(ta)
		ta.select()
		document.execCommand("copy")
		document.body.removeChild(ta)
	}
	emit("path-selected", selectedPath.value)
}

// Reset when rootDoctype changes
watch(() => props.rootDoctype, () => {
	resetSelection()
})
</script>

<style scoped>
.pathfinder-popup-overlay {
	position: fixed;
	inset: 0;
	z-index: 1080;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.4);
	backdrop-filter: blur(2px);
}

.pathfinder-popup {
	width: 520px;
	max-height: 80vh;
	display: flex;
	flex-direction: column;
	background: white;
	border-radius: 12px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	overflow: hidden;
}

.popup-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	border-bottom: 1px solid #e2e8f0;
	background: #f8fafc;
}

.popup-title {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 600;
	color: #1e293b;
}

.popup-doctype {
	font-size: 11px;
	font-weight: 400;
	color: #64748b;
	background: #e2e8f0;
	padding: 2px 8px;
	border-radius: 4px;
	font-family: monospace;
}

.popup-close {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border: none;
	background: transparent;
	border-radius: 6px;
	cursor: pointer;
	color: #64748b;
}

.popup-close:hover {
	background: #e2e8f0;
	color: #1e293b;
}

.popup-body {
	padding: 16px;
	overflow-y: auto;
}

.popup-output {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.output-path {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 10px 12px;
	background: #f0fdf4;
	border: 1px solid #bbf7d0;
	border-radius: 8px;
}

.output-path code {
	font-size: 12px;
	font-family: "SF Mono", "Fira Code", monospace;
	color: #166534;
	word-break: break-all;
}

.output-options {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.option-btn {
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 12px 14px;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	background: white;
	cursor: pointer;
	transition: all 0.15s ease;
	text-align: left;
}

.option-btn:hover {
	border-color: #93c5fd;
	background: #eff6ff;
}

.option-icon {
	display: flex;
	color: #64748b;
	flex-shrink: 0;
	margin-top: 2px;
}

.option-btn:hover .option-icon {
	color: #3b82f6;
}

.option-label {
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.option-title {
	font-size: 13px;
	font-weight: 600;
	color: #1e293b;
}

.option-desc {
	font-size: 11px;
	color: #64748b;
	font-family: monospace;
}

.btn-back {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 8px 12px;
	border: none;
	background: transparent;
	color: #64748b;
	font-size: 12px;
	cursor: pointer;
	border-radius: 6px;
	align-self: flex-start;
}

.btn-back:hover {
	background: #f1f5f9;
	color: #1e293b;
}

/* Virtual field form */
.popup-vf-form {
	display: flex;
	flex-direction: column;
	gap: 16px;
}

.vf-form-header {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 14px;
	font-weight: 600;
	color: #1e293b;
}

.vf-form {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.vf-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.vf-field label {
	font-size: 12px;
	font-weight: 500;
	color: #475569;
}

.vf-input {
	padding: 8px 10px;
	border: 1px solid #cbd5e1;
	border-radius: 6px;
	font-size: 13px;
	outline: none;
	transition: border-color 0.15s;
}

.vf-input:focus {
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
}

.vf-row {
	display: flex;
	gap: 20px;
}

.vf-check {
	display: flex;
	align-items: center;
	gap: 6px;
	font-size: 12px;
	color: #475569;
	cursor: pointer;
}

.vf-actions {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	padding-top: 4px;
}

.vf-btn {
	padding: 8px 16px;
	border-radius: 6px;
	font-size: 13px;
	font-weight: 500;
	border: none;
	cursor: pointer;
}

.vf-btn-secondary {
	background: #f1f5f9;
	color: #475569;
}

.vf-btn-secondary:hover {
	background: #e2e8f0;
}

.vf-btn-primary {
	background: #3b82f6;
	color: white;
}

.vf-btn-primary:hover {
	background: #2563eb;
}

.vf-btn-primary:disabled {
	background: #94a3b8;
	cursor: not-allowed;
}
</style>
