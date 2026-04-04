<template>
	<div class="pathfinder-panel-designer">
		<PathFinderCore
			v-if="doctype"
			:rootDoctype="doctype"
			mode="single"
			@path-selected="$emit('path-selected', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
import PathFinderCore from "./PathFinderCore.vue"

defineProps<{
	doctype: string
}>()

defineEmits<{
	(e: "path-selected", path: string): void
}>()
</script>
