<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { renderMarkdown } from '$lib/markdown';
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/TopBar.svelte';

	interface MatchResult {
		trialId: string;
		trialName: string;
		phase: string;
		indication: string;
		patientDid: string;
		confidence: number;
		matchedCriteria: number;
		totalCriteria: number;
		details?: string;
		checkedAt: string;
	}

	interface GroupedMatches {
		trialId: string;
		trialName: string;
		phase: string;
		indication: string;
		matchCount: number;
		averageConfidence: number;
		matches: MatchResult[];
	}

	let matches: MatchResult[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');
	let selectedTrial = $state<string | null>(null);

	onMount(async () => {
		await fetchMatches();
	});

	async function fetchMatches() {
		try {
			isLoading = true;
			error = '';

			const response = await fetch(`${API_BASE}/api/pharma/matches`);
			if (!response.ok) throw new Error('Failed to fetch match results');

			const data = await response.json();
			matches = data.matches || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load match results';
			console.error('Error fetching matches:', err);
		} finally {
			isLoading = false;
		}
	}

	const groupedMatches = $derived(() => {
		const grouped = new Map<string, GroupedMatches>();

		matches.forEach((match) => {
			if (!grouped.has(match.trialId)) {
				grouped.set(match.trialId, {
					trialId: match.trialId,
					trialName: match.trialName,
					phase: match.phase,
					indication: match.indication,
					matchCount: 0,
					averageConfidence: 0,
					matches: [],
				});
			}

			const group = grouped.get(match.trialId)!;
			group.matches.push(match);
			group.matchCount = group.matches.length;
			group.averageConfidence =
				group.matches.reduce((sum, m) => sum + m.confidence, 0) / group.matches.length;
		});

		return Array.from(grouped.values());
	});

	const filteredGroups = $derived(() => {
		const groups = groupedMatches();
		if (!searchQuery) return groups;

		return groups.filter((group) =>
			group.trialName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			group.indication.toLowerCase().includes(searchQuery.toLowerCase())
		);
	});

	const totalMatches = $derived(matches.length);
	const totalTrials = $derived(new Set(matches.map((m) => m.trialId)).size);
	const avgConfidence = $derived(
		matches.length > 0
			? (matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length) * 100
			: 0
	);
</script>

<TopBar title="Match Results" showSearch={false} userType="pharma" userId="TRIAL-2026-003" />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	{#if error}
		<div class="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-4 flex items-center gap-3">
			<span class="material-symbols-outlined">error</span>
			<p>{error}</p>
		</div>
	{/if}

	{#if isLoading}
		<div class="flex items-center justify-center py-12">
			<div class="flex flex-col items-center gap-4">
				<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				<p class="text-on-surface-variant">Loading match results...</p>
			</div>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Matches</p>
					<p class="text-display-xl text-[var(--color-tm-success)] text-glow">{totalMatches}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[24px]">group</span>
				</div>
			</div>

			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Trials</p>
					<p class="text-display-xl text-[var(--color-tm-cyan)] text-glow">{totalTrials}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-cyan)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-cyan)] text-[24px]">science</span>
				</div>
			</div>

			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Avg Confidence</p>
					<p class="text-display-xl text-[var(--color-tm-warning)] text-glow">{avgConfidence.toFixed(0)}%</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-warning)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-warning)] text-[24px]">analytics</span>
				</div>
			</div>
		</div>

		{#if matches.length === 0}
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-12 inner-glow flex flex-col items-center justify-center text-center">
				<span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">person_search</span>
				<h3 class="text-headline-md font-bold text-on-surface mb-2">No Matches Yet</h3>
				<p class="text-body-md text-on-surface-variant max-w-md mb-6">
					Deploy agents for your trials and run matching to see eligible patients here.
				</p>
				<a href="/pharma/trials" class="btn-primary">
					<span class="material-symbols-outlined text-[18px]">arrow_back</span>
					Go to My Trials
				</a>
			</div>
		{:else}
			<!-- Search Bar -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
				<div class="relative">
					<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
					<input 
						type="text" 
						bind:value={searchQuery}
						class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg text-body-md text-on-surface pl-10 pr-3 py-2 focus:border-primary focus:ring-2 focus:ring-primary/20 w-full placeholder:text-on-surface-variant outline-none" 
						placeholder="Search by trial name or indication..."
					/>
				</div>
			</div>

			<!-- Grouped Match Results -->
			<div class="space-y-4">
				{#each filteredGroups() as group}
					<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl inner-glow overflow-hidden">
						<!-- Trial Header -->
						<div 
							class="p-stack-md bg-[var(--color-tm-elevated)] border-b border-[var(--color-tm-border)] cursor-pointer hover:bg-[var(--color-tm-base)] transition-colors"
							onclick={() => selectedTrial = selectedTrial === group.trialId ? null : group.trialId}
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-4">
									<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
										<span class="material-symbols-outlined text-primary text-[20px]">clinical_notes</span>
									</div>
									<div>
										<h3 class="text-headline-sm font-bold text-on-surface">{group.trialName}</h3>
										<p class="text-label-sm text-on-surface-variant">
											{group.indication} • {group.phase}
										</p>
									</div>
								</div>
								<div class="flex items-center gap-6">
									<div class="text-right">
										<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">Matches</p>
										<p class="text-headline-lg font-bold text-[var(--color-tm-success)]">{group.matchCount}</p>
									</div>
									<div class="text-right">
										<p class="text-label-sm text-on-surface-variant uppercase tracking-wider">Avg Confidence</p>
										<p class="text-headline-lg font-bold text-[var(--color-tm-cyan)]">
											{(group.averageConfidence * 100).toFixed(0)}%
										</p>
									</div>
									<span class="material-symbols-outlined text-on-surface-variant transition-transform" class:rotate-180={selectedTrial === group.trialId}>
										expand_more
									</span>
								</div>
							</div>
						</div>

						<!-- Patient Matches (Expandable) -->
						{#if selectedTrial === group.trialId}
							<div class="p-stack-md">
								<div class="space-y-2">
									{#each group.matches as match}
										<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 hover:border-primary/50 transition-colors">
											<div class="flex items-start justify-between mb-3">
												<div class="flex items-center gap-3">
													<div class="w-8 h-8 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center shrink-0">
														<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[18px]">person</span>
													</div>
													<div>
														<p class="text-label-md font-mono text-on-surface">{match.patientDid.slice(0, 30)}...</p>
														<p class="text-label-sm text-on-surface-variant">
															Matched {match.matchedCriteria}/{match.totalCriteria} criteria
														</p>
													</div>
												</div>
												<div class="flex items-center gap-3">
													<div class="text-right">
														<p class="text-label-sm text-on-surface-variant">Confidence</p>
														<p class="text-headline-md font-bold text-[var(--color-tm-success)]">
															{(match.confidence * 100).toFixed(0)}%
														</p>
													</div>
													<div class="text-right">
														<p class="text-label-sm text-on-surface-variant">Checked</p>
														<p class="text-label-md text-on-surface">
															{new Date(match.checkedAt).toLocaleDateString()}
														</p>
													</div>
													<a 
														href={`/pharma/messages?trialId=${match.trialId}&patientDid=${match.patientDid}`}
														class="btn-primary py-2 px-3 text-sm flex items-center gap-1"
													>
														<span class="material-symbols-outlined text-[16px]">chat</span>
														Contact
													</a>
												</div>
											</div>
											
											{#if match.details}
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3 mt-3">
													<div class="flex items-start gap-2">
														<span class="material-symbols-outlined text-primary text-[18px] shrink-0">lightbulb</span>
														<div>
															<p class="text-label-sm font-semibold text-on-surface mb-1">AI Summary</p>
															<p class="text-body-sm text-on-surface-variant leading-relaxed">{@html renderMarkdown(match.details)}</p>
														</div>
													</div>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</main>
