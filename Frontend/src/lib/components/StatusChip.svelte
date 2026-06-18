<script lang="ts">
	let { status = 'active', size = 'md' } = $props<{
		status: string; // e.g., 'active', 'pending', 'completed', 'eligible', 'not-eligible'
		size?: 'sm' | 'md';
	}>();

	// Map status string to specific styling tokens
	const styles = $derived(() => {
		const normalized = status.toLowerCase();
		
		if (normalized.includes('active') || normalized.includes('eligible') || normalized.includes('completed') || normalized.includes('verified')) {
			if (normalized === 'not eligible') return { bg: 'bg-[var(--color-tm-error)]/10', border: 'border-[var(--color-tm-error)]/20', text: 'text-[var(--color-tm-error)]' };
			return { bg: 'bg-[var(--color-tm-success)]/10', border: 'border-[var(--color-tm-success)]/20', text: 'text-[var(--color-tm-success)]' };
		}
		
		if (normalized.includes('pending') || normalized.includes('paused') || normalized.includes('reviewing')) {
			return { bg: 'bg-[var(--color-tm-warning)]/10', border: 'border-[var(--color-tm-warning)]/20', text: 'text-[var(--color-tm-warning)]' };
		}
		
		if (normalized.includes('processing') || normalized.includes('running')) {
			return { bg: 'bg-[var(--color-tm-cyan)]/10', border: 'border-[var(--color-tm-cyan)]/20', text: 'text-[var(--color-tm-cyan)]' };
		}
		
		// Default / Inactive
		return { bg: 'bg-[var(--color-tm-elevated)]', border: 'border-[var(--color-tm-border)]', text: 'text-on-surface-variant' };
	});
	
	const currentStyles = $derived(styles());
</script>

<span class="inline-flex items-center rounded font-medium border {currentStyles.bg} {currentStyles.border} {currentStyles.text} {size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'}">
	{status}
</span>
