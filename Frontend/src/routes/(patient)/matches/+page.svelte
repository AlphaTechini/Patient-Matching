<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import { API_BASE } from '$lib/config';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	
	interface Trial {
		id: string;
		name: string;
		phase: string;
		indication: string;
		sponsor: string;
		description: string;
		criteria: {
			inclusion: Array<{ field: string; expected: string | null; description?: string }>;
			exclusion: Array<{ field: string; expected: string | null; description?: string }>;
		};
	}
	
	let trials = $state<Trial[]>([]);
	let loading = $state(true);
	let error = $state('');
	
	onMount(async () => {
		// Check auth
		identityStore.restore();
		if (!identityStore.isAuthenticated) {
			goto('/login');
			return;
		}
		
		// Fetch trials
		try {
			const response = await fetch(`${API_BASE}/api/trials/all`);
			if (!response.ok) throw new Error('Failed to fetch trials');
			
			const data = await response.json();
			trials = data.trials || [];
		} catch (err: any) {
			error = err.message || 'Failed to load trials';
		} finally {
			loading = false;
		}
	});
</script>

<TopBar title="Trial Matches" />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto">
	
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-stack-lg gap-4">
		<div>
			<h2 class="text-headline-md font-bold text-on-surface">Match Results</h2>
			<p class="text-body-md text-on-surface-variant">Trials where your encrypted profile meets the eligibility criteria.</p>
		</div>
		<button class="btn-ghost flex items-center gap-2">
			<span class="material-symbols-outlined text-[18px]">filter_list</span>
			Filter & Sort
		</button>
	</div>

	<!-- Summary Stats Strip -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-stack-lg border-b border-[var(--color-tm-border)] pb-8">
		<div class="pl-4 border-l-2 border-primary">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Available Trials</p>
			<p class="text-headline-lg font-bold text-primary">{trials.length}</p>
		</div>
		<div class="pl-4 border-l-2 border-[var(--color-tm-warning)]">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Phase III</p>
			<p class="text-headline-lg font-bold text-on-surface">{trials.filter(t => t.phase === 'III').length}</p>
		</div>
		<div class="pl-4 border-l-2 border-[var(--color-tm-success)]">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Phase II</p>
			<p class="text-headline-lg font-bold text-on-surface">{trials.filter(t => t.phase === 'II').length}</p>
		</div>
		<div class="pl-4 border-l-2 border-outline-variant/30">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Phase I</p>
			<p class="text-headline-lg font-bold text-on-surface-variant">{trials.filter(t => t.phase === 'I').length}</p>
		</div>
	</div>

	<!-- Match Cards List -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<div class="text-center">
				<div class="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
				<p class="text-body-md text-on-surface-variant">Loading trials...</p>
			</div>
		</div>
	{:else if error}
		<div class="bg-[var(--color-tm-danger)]/10 border border-[var(--color-tm-danger)]/20 rounded-lg p-6 text-center">
			<span class="material-symbols-outlined text-[var(--color-tm-danger)] text-[48px] mb-3 block">error</span>
			<p class="text-body-md text-[var(--color-tm-danger)]">{error}</p>
		</div>
	{:else if trials.length === 0}
		<div class="text-center py-12">
			<span class="material-symbols-outlined text-on-surface-variant text-[64px] mb-4 block">clinical_notes</span>
			<p class="text-headline-sm text-on-surface mb-2">No Trials Available</p>
			<p class="text-body-md text-on-surface-variant">Check back later for new trial opportunities.</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each trials as trial, index}
				<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-primary/50 transition-colors relative overflow-hidden group">
					<!-- Subtle glow effect behind card -->
					<div class="absolute -inset-px bg-gradient-to-r from-primary/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
					
					<div class="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
						<!-- Left side: Info -->
						<div class="flex-1">
							<div class="flex items-center gap-3 mb-2">
								<span class="px-2 py-1 rounded bg-primary/10 text-primary text-label-sm font-medium">Phase {trial.phase}</span>
								<span class="text-label-sm text-on-surface-variant">{trial.indication}</span>
							</div>
							<h3 class="text-headline-md font-bold text-on-surface mb-2">{trial.name}</h3>
							<p class="text-body-md text-on-surface-variant mb-4 max-w-3xl">{trial.description}</p>
							
							<div class="flex flex-wrap gap-2 mb-4">
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
									<span class="material-symbols-outlined text-[14px]">science</span>
									{trial.sponsor}
								</span>
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant font-mono-data">
									{trial.criteria.inclusion.length} inclusion criteria
								</span>
								<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant font-mono-data">
									{trial.criteria.exclusion.length} exclusion criteria
								</span>
							</div>
						</div>
						
						<!-- Right side: Action -->
						<div class="lg:w-64 shrink-0 flex flex-col justify-center items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[var(--color-tm-border)] pt-4 lg:pt-0 lg:pl-6">
							<div class="flex flex-col gap-2 w-full">
								<a href="/trial/{trial.id}" class="btn-primary w-full justify-center">
									Check Eligibility
								</a>
								<p class="text-label-sm text-on-surface-variant text-center">
									Matching runs in TEE enclave
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>
