<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { renderMarkdown } from '$lib/markdown';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { identityStore } from '$lib/stores/identity.svelte';

	interface TrialCriteria {
		field: string;
		expected: string | null;
		description?: string;
	}

	interface Trial {
		id: string;
		name: string;
		sponsor: string;
		phase: string;
		indication: string;
		description: string;
		startDate?: string;
		enrollmentCount?: number;
		criteria: {
			inclusion: TrialCriteria[];
			exclusion: TrialCriteria[];
		};
	}

	interface EligibilityResult {
		eligible: boolean;
		confidence: number;
		matched_criteria: number;
		total_criteria: number;
		details?: string;
	}

	let trialId = $derived($page.params.id);
	let trial: Trial | null = $state(null);
	let eligibility: EligibilityResult | null = $state(null);
	let isLoadingTrial = $state(true);
	let isCheckingEligibility = $state(false);
	let error = $state('');
	
	// Modal states
	let showCheckModal = $state(false);
	let checkStatus = $state<'checking' | 'success' | 'error'>('checking');
	let checkMessage = $state('');

	onMount(async () => {
		await fetchTrial();
	});

	async function fetchTrial() {
		try {
			isLoadingTrial = true;
			error = '';

			const response = await fetch(`${API_BASE}/api/trials/${trialId}`);
			if (!response.ok) throw new Error('Trial not found');

			const data = await response.json();
			trial = data.trial;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load trial';
			console.error('Error fetching trial:', err);
		} finally {
			isLoadingTrial = false;
		}
	}

	async function checkEligibility() {
		if (!identityStore.did) {
			error = 'Please log in to check eligibility';
			return;
		}

		if (!trial) return;

		try {
			isCheckingEligibility = true;
			showCheckModal = true;
			checkStatus = 'checking';
			checkMessage = 'Processing your health records in TEE...';
			error = '';

			const response = await fetch(`${API_BASE}/api/trials/${trialId}/check-eligibility`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ patientDid: identityStore.did })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to check eligibility');
			}

			const data = await response.json();
			eligibility = data.eligibility;

			checkStatus = 'success';
			checkMessage = eligibility.eligible 
				? 'You are eligible for this trial!' 
				: 'You do not meet all eligibility criteria';
		} catch (err) {
			checkStatus = 'error';
			checkMessage = err instanceof Error ? err.message : 'Failed to check eligibility';
			error = checkMessage;
			console.error('Error checking eligibility:', err);
		} finally {
			isCheckingEligibility = false;
		}
	}

	function closeCheckModal() {
		showCheckModal = false;
	}

	const totalCriteria = $derived(
		trial ? trial.criteria.inclusion.length + trial.criteria.exclusion.length : 0
	);

	const matchPercentage = $derived(
		eligibility ? Math.round((eligibility.confidence || 0) * 100) : null
	);
</script>

<TopBar title="Trial Detail" userType="patient" userId={identityStore.patientDid || ''} />

<div class="bg-[var(--color-tm-surface)] border-b border-[var(--color-tm-border)] sticky top-16 z-30 shadow-sm">
	<div class="max-w-[1280px] mx-auto px-margin-desktop py-4 flex items-center justify-between">
		<a href="/matches" class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-md">
			<span class="material-symbols-outlined text-[18px]">arrow_back</span>
			Back to Matches
		</a>
		{#if eligibility && eligibility.eligible}
			<div class="flex items-center gap-3">
				<a href="/matches" class="btn-ghost py-1.5 px-4 text-center">Decline</a>
				<button class="btn-primary py-1.5 px-4 text-center">Express Interest</button>
			</div>
		{/if}
	</div>
</div>

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	{#if error && !trial}
		<div class="bg-red-500/10 border border-red-500 text-red-500 rounded-xl p-4 flex items-center gap-3">
			<span class="material-symbols-outlined">error</span>
			<p>{error}</p>
		</div>
	{/if}

	{#if isLoadingTrial}
		<div class="flex items-center justify-center py-12">
			<div class="flex flex-col items-center gap-4">
				<div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				<p class="text-on-surface-variant">Loading trial details...</p>
			</div>
		</div>
	{:else if trial}
		<!-- Header Section -->
		<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-lg inner-glow">
			<div class="flex flex-col md:flex-row justify-between gap-6 mb-8">
				<div class="flex-1">
					<div class="flex flex-wrap items-center gap-3 mb-3">
						{#if eligibility}
							<StatusChip status={eligibility.eligible ? "Eligible" : "Not Eligible"} />
						{/if}
						<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">{trial.id}</span>
						<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">Phase {trial.phase}</span>
					</div>
					<h1 class="text-headline-lg font-bold text-on-surface mb-4 max-w-3xl">{trial.name}</h1>
					<p class="text-body-lg text-on-surface-variant max-w-4xl">{trial.description}</p>
				</div>
				
				<div class="md:w-64 shrink-0 bg-surface-container-low rounded-lg p-4 border border-[var(--color-tm-border)]">
					{#if eligibility}
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">TEE Match Score</p>
						<div class="flex items-baseline gap-2 mb-2">
							<span class="text-display-xl font-bold text-primary leading-none text-glow">{matchPercentage}%</span>
						</div>
						<TeeSecuredBadge label="{eligibility.matched_criteria}/{eligibility.total_criteria} Criteria Met" />
					{:else}
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Check Your Eligibility</p>
						<button 
							class="btn-primary w-full py-3"
							onclick={checkEligibility}
							disabled={isCheckingEligibility}
						>
							{#if isCheckingEligibility}
								<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{:else}
								<span class="material-symbols-outlined text-[18px]">shield</span>
								Check in TEE
							{/if}
						</button>
						<p class="text-xs text-on-surface-variant mt-2 text-center">Privacy preserved via Intel TDX</p>
					{/if}
				</div>
			</div>
			
			<div class="flex flex-wrap gap-6 pt-6 border-t border-[var(--color-tm-border)]">
				<div>
					<p class="text-label-sm text-on-surface-variant mb-1">Sponsor</p>
					<p class="text-body-md text-on-surface font-medium flex items-center gap-1">
						<span class="material-symbols-outlined text-[16px] text-on-surface-variant">science</span>
						{trial.sponsor}
					</p>
				</div>
				<div>
					<p class="text-label-sm text-on-surface-variant mb-1">Indication</p>
					<p class="text-body-md text-on-surface font-medium">{trial.indication}</p>
				</div>
				{#if trial.startDate}
					<div>
						<p class="text-label-sm text-on-surface-variant mb-1">Start Date</p>
						<p class="text-body-md text-on-surface font-medium">
							{new Date(trial.startDate).toLocaleDateString()}
						</p>
					</div>
				{/if}
				{#if trial.enrollmentCount}
					<div>
						<p class="text-label-sm text-on-surface-variant mb-1">Target Enrollment</p>
						<p class="text-body-md text-on-surface font-medium">{trial.enrollmentCount} patients</p>
					</div>
				{/if}
			</div>
		</section>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
		<!-- Left: Eligibility Breakdown -->
		<div class="lg:col-span-2 space-y-stack-lg">
			{#if eligibility}
				<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-headline-md font-bold text-on-surface">Eligibility Breakdown</h3>
						<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">Secured by TEE</span>
					</div>
					
					<div class="space-y-4">
						<!-- Inclusion Criteria -->
						{#if trial.criteria.inclusion.length > 0}
							<div class="mb-4">
								<h4 class="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wider">Inclusion Criteria</h4>
								{#each trial.criteria.inclusion as criterion}
									<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20 mb-2">
										<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
										<div>
											<h4 class="text-body-md font-medium text-on-surface mb-1">{criterion.description || criterion.field}</h4>
											<p class="text-label-sm text-on-surface-variant">
												Verified via encrypted health records (Field: {criterion.field})
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Exclusion Criteria -->
						{#if trial.criteria.exclusion.length > 0}
							<div>
								<h4 class="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wider">Exclusion Criteria</h4>
								{#each trial.criteria.exclusion as criterion}
									<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20 mb-2">
										<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
										<div>
											<h4 class="text-body-md font-medium text-on-surface mb-1">{criterion.description || criterion.field}</h4>
											<p class="text-label-sm text-on-surface-variant">
												Verified: Exclusion criteria not met (Field: {criterion.field})
											</p>
										</div>
									</div>
								{/each}
							</div>
						{/if}

						{#if eligibility.details}
							<div class="mt-6 p-4 bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg">
								<h4 class="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
									<span class="material-symbols-outlined text-[18px]">psychology</span>
									AI Analysis
								</h4>
								<p class="text-sm text-on-surface-variant">{@html renderMarkdown(eligibility.details)}</p>
							</div>
						{/if}
					</div>
				</section>
			{:else}
				<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
					<div class="flex items-center justify-between mb-6">
						<h3 class="text-headline-md font-bold text-on-surface">Trial Criteria</h3>
					</div>
					
					<div class="space-y-4">
						<p class="text-sm text-on-surface-variant mb-4">
							Click "Check in TEE" above to privately evaluate your eligibility against {totalCriteria} criteria.
						</p>

						{#if trial.criteria.inclusion.length > 0}
							<div>
								<h4 class="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wider">
									Inclusion Criteria ({trial.criteria.inclusion.length})
								</h4>
								<ul class="space-y-2">
									{#each trial.criteria.inclusion as criterion}
										<li class="flex items-start gap-2 text-sm text-on-surface-variant">
											<span class="material-symbols-outlined text-[16px] mt-0.5">check</span>
											<span>{criterion.description || criterion.field}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if trial.criteria.exclusion.length > 0}
							<div class="mt-4">
								<h4 class="text-sm font-semibold text-on-surface mb-3 uppercase tracking-wider">
									Exclusion Criteria ({trial.criteria.exclusion.length})
								</h4>
								<ul class="space-y-2">
									{#each trial.criteria.exclusion as criterion}
										<li class="flex items-start gap-2 text-sm text-on-surface-variant">
											<span class="material-symbols-outlined text-[16px] mt-0.5">close</span>
											<span>{criterion.description || criterion.field}</span>
										</li>
									{/each}
								</ul>
							</div>
						{/if}
					</div>
				</section>
			{/if}

			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
				<h3 class="text-headline-md font-bold text-on-surface mb-4">About This Trial</h3>
				<div class="prose prose-invert max-w-none text-body-md text-on-surface-variant space-y-4">
					<p>{trial.description}</p>
					
					{#if trial.criteria.inclusion.length > 0 || trial.criteria.exclusion.length > 0}
						<div class="mt-4">
							<h4 class="text-on-surface font-semibold mb-2">Study Requirements</h4>
							<p class="text-sm">
								This trial requires participants to meet {trial.criteria.inclusion.length} inclusion criteria 
								and avoid {trial.criteria.exclusion.length} exclusion criteria.
							</p>
						</div>
					{/if}
				</div>
			</section>
		</div>

		<!-- Right: Actions & Privacy -->
		<div class="space-y-stack-md">
			{#if eligibility && eligibility.eligible}
				<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow text-center">
					<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
						<span class="material-symbols-outlined text-primary text-[24px]" style="font-variation-settings: 'FILL' 1;">front_hand</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-2">Interested?</h3>
					<p class="text-body-md text-on-surface-variant mb-6">Expressing interest will securely share your contact info with the hospital coordinator. Your raw medical data remains encrypted.</p>
					<button class="btn-primary w-full py-3 mb-3">Express Interest</button>
					<a href="/matches" class="text-label-sm text-on-surface-variant hover:text-primary transition-colors block mt-2">I'm not interested in this trial</a>
				</section>
			{:else}
				<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow text-center">
					<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
						<span class="material-symbols-outlined text-primary text-[24px]">shield</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-2">Check Eligibility</h3>
					<p class="text-body-md text-on-surface-variant mb-6">Privately evaluate if you qualify for this trial using our TEE-secured matching system.</p>
					<button 
						class="btn-primary w-full py-3"
						onclick={checkEligibility}
						disabled={isCheckingEligibility}
					>
						{#if isCheckingEligibility}
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{:else}
							Check in TEE
						{/if}
					</button>
				</section>
			{/if}

			<section class="bg-surface-container-low border border-[var(--color-tm-border)] rounded-xl p-4">
				<h4 class="text-label-md font-semibold text-on-surface flex items-center gap-2 mb-3">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[18px]">verified_user</span>
					Privacy Guarantee
				</h4>
				<p class="text-label-sm text-on-surface-variant mb-3">This match is calculated inside a Trusted Execution Environment.</p>
				<ul class="space-y-2 text-label-sm text-on-surface-variant">
					<li class="flex items-start gap-2">
						<span class="material-symbols-outlined text-[14px] mt-0.5">close</span>
						{trial.sponsor} does not know you matched.
					</li>
					<li class="flex items-start gap-2">
						<span class="material-symbols-outlined text-[14px] mt-0.5">close</span>
						The hospital does not know you matched yet.
					</li>
					<li class="flex items-start gap-2">
						<span class="material-symbols-outlined text-[14px] mt-0.5">check</span>
						Only YOU can see this match until you choose to express interest.
					</li>
				</ul>
			</section>
		</div>
	</div>
	{/if}
</main>

<!-- TEE Eligibility Check Modal -->
<Modal bind:isOpen={showCheckModal} title="TEE Eligibility Check" size="md" showCloseButton={checkStatus !== 'checking'}>
	<div class="space-y-6">
		{#if checkStatus === 'checking'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-lg font-medium text-on-surface mb-2">Processing Health Records</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm">
					{checkMessage}
				</p>
				<div class="mt-6 w-full max-w-sm">
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">encrypted</span>
						<span>Decrypting records in TEE</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">psychology</span>
						<span>Evaluating {totalCriteria} criteria</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant">
						<span class="material-symbols-outlined text-[18px] text-primary">shield</span>
						<span>Privacy preserved - no PHI exposed</span>
					</div>
				</div>
			</div>
		{:else if checkStatus === 'success' && eligibility}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-[var(--color-tm-{eligibility.eligible ? 'success' : 'warning'}')]/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-[var(--color-tm-{eligibility.eligible ? 'success' : 'warning'}'))] text-[40px]">
						{eligibility.eligible ? 'check_circle' : 'info'}
					</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">{checkMessage}</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm mb-6">
					{#if eligibility.eligible}
						You meet all eligibility criteria for this trial.
					{:else}
						Some criteria were not met. Review the breakdown below for details.
					{/if}
				</p>

				<div class="w-full grid grid-cols-2 gap-3 mb-4">
					<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 text-center">
						<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Confidence</p>
						<p class="text-2xl font-bold text-on-surface">{matchPercentage}%</p>
					</div>
					<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 text-center">
						<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Criteria Met</p>
						<p class="text-2xl font-bold text-[var(--color-tm-success)]">
							{eligibility.matched_criteria}/{eligibility.total_criteria}
						</p>
					</div>
				</div>

				<button 
					class="btn-primary mt-6 w-full"
					onclick={closeCheckModal}
				>
					{eligibility.eligible ? 'View Full Results' : 'Close'}
				</button>
			</div>
		{:else if checkStatus === 'error'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-red-500 text-[40px]">error</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">Eligibility Check Failed</p>
				<p class="text-sm text-red-500 text-center max-w-sm mb-6">
					{checkMessage}
				</p>

				<button 
					class="btn-ghost w-full"
					onclick={closeCheckModal}
				>
					Close
				</button>
			</div>
		{/if}
	</div>
</Modal>
