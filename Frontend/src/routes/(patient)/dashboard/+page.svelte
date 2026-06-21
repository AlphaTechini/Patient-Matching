<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import HealthRecordUpload from '$lib/components/HealthRecordUpload.svelte';
	import { API_BASE } from '$lib/config';
	
	let activeMatchesCount = $state(0);
	let isLoadingMatches = $state(true);
	let recentMatches = $state<any[]>([]);

	onMount(async () => {
		// Restore identity and check auth
		identityStore.restore();
		if (!identityStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch patient matches from backend
		await fetchPatientMatches();
	});

	async function fetchPatientMatches() {
		if (!identityStore.patientDid) return;

		try {
			isLoadingMatches = true;

			// Fetch all trials to check for matches
			const trialsResponse = await fetch(`${API_BASE}/api/trials/all`);
			if (!trialsResponse.ok) throw new Error('Failed to fetch trials');

			const trialsData = await trialsResponse.json();
			const trials = trialsData.trials || [];

			// For each trial, check if there's a cached match result for this patient
			const matchPromises = trials.map(async (trial: any) => {
				try {
					const response = await fetch(`${API_BASE}/api/trials/${trial.id}/check-eligibility`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ patientDid: identityStore.patientDid })
					});

					if (response.ok) {
						const data = await response.json();
						if (data.eligibility?.eligible) {
							return {
								trialId: trial.id,
								trialName: trial.name,
								sponsor: trial.sponsor,
								phase: trial.phase,
								confidence: data.eligibility.confidence,
								matchedCriteria: data.eligibility.matched_criteria,
								totalCriteria: data.eligibility.total_criteria,
								cached: data.cached
							};
						}
					}
				} catch (err) {
					console.error(`Error checking trial ${trial.id}:`, err);
				}
				return null;
			});

			const results = await Promise.all(matchPromises);
			const eligibleMatches = results.filter(m => m !== null);

			activeMatchesCount = eligibleMatches.length;
			recentMatches = eligibleMatches.slice(0, 2); // Show top 2 matches

		} catch (error) {
			console.error('Error fetching matches:', error);
		} finally {
			isLoadingMatches = false;
		}
	}
</script>

<TopBar title="Dashboard" showSearch={false} userType="patient" userId={identityStore.patientDid || ''} />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto">
	<!-- Active Matches Card -->
	<div class="mb-stack-lg">
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex flex-col justify-between min-h-[160px]">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Matches</p>
					{#if isLoadingMatches}
						<div class="flex items-center gap-2">
							<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
							<p class="text-body-md text-on-surface-variant">Loading matches...</p>
						</div>
					{:else}
						<p class="text-display-xl text-on-surface">{activeMatchesCount}</p>
					{/if}
				</div>
				<div class="w-10 h-10 rounded-full bg-[var(--color-tm-indigo)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-indigo)]">biotech</span>
				</div>
			</div>
			{#if !isLoadingMatches && activeMatchesCount > 0}
				<a href="/matches" class="text-label-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 mt-4 w-max">
					View all {activeMatchesCount} {activeMatchesCount === 1 ? 'match' : 'matches'}
					<span class="material-symbols-outlined text-[16px]">arrow_forward</span>
				</a>
			{:else if !isLoadingMatches}
				<p class="text-label-sm text-on-surface-variant mt-4">No eligible matches yet. Upload your health records to start matching.</p>
			{/if}
		</div>
	</div>

	<div class="grid grid-cols-1 gap-gutter">
		<!-- Health Record Upload -->
		<HealthRecordUpload />
		
		<!-- Live Matches -->
		{#if !isLoadingMatches && recentMatches.length > 0}
			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl inner-glow flex flex-col">
				<div class="p-stack-md border-b border-[var(--color-tm-border)] flex justify-between items-center bg-surface-container-low/50">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] animate-pulse-slow"></span>
						<h3 class="text-label-md font-semibold text-on-surface">Recent Matches</h3>
					</div>
					<a href="/matches" class="text-label-sm text-on-surface-variant hover:text-primary transition-colors">View All</a>
				</div>
				
				<div class="flex flex-col divide-y divide-[var(--color-tm-border)]">
					{#each recentMatches as match}
						<div class="p-4 hover:bg-surface-container transition-colors group flex items-start gap-4">
							<div class="w-10 h-10 rounded-lg bg-[var(--color-tm-cyan)]/10 border border-[var(--color-tm-cyan)]/20 flex items-center justify-center shrink-0 mt-1">
								<span class="text-label-md font-bold text-primary">{Math.round(match.confidence * 100)}%</span>
							</div>
							<div class="flex-1 min-w-0">
								<div class="flex justify-between items-start mb-1">
									<h4 class="text-body-md font-medium text-on-surface truncate pr-4 group-hover:text-primary transition-colors cursor-pointer">{match.trialName}</h4>
									<StatusChip status="Eligible" size="sm" />
								</div>
								<p class="text-label-sm text-on-surface-variant truncate mb-2">{match.sponsor} &bull; {match.phase}</p>
								<div class="flex flex-wrap gap-2">
									<span class="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-outline-variant text-on-surface-variant">
										Criteria: {match.matchedCriteria}/{match.totalCriteria}
									</span>
									{#if match.cached}
										<span class="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-[var(--color-tm-success)] text-[var(--color-tm-success)]">
											Cached
										</span>
									{/if}
								</div>
							</div>
							<a href="/trial/{match.trialId}" class="shrink-0 text-on-surface-variant hover:text-primary transition-colors p-2 mt-1">
								<span class="material-symbols-outlined text-[20px]">chevron_right</span>
							</a>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</div>
</main>
