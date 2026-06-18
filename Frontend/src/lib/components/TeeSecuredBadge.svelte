<script lang="ts">
	let { label = 'Verified' } = $props<{
		label?: string;
	}>();
</script>

<div class="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-surface-container-high border border-outline-variant inner-glow">
	<span class="material-symbols-outlined text-[14px] text-primary">lock</span>
	<span class="text-label-sm text-on-surface">{label}</span>
</div>
