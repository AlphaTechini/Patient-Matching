<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { renderMarkdown } from '$lib/markdown';
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import Modal from '$lib/components/Modal.svelte';

	interface Trial {
		id: string;
		name: string;
		sponsor: string;
		phase: string;
		indication: string;
		criteria: {
			inclusion: string[];
			exclusion: string[];
		};
		createdAt: string;
	}

	interface Agent {
		agentName: string;
		agentDid: string;
		status: string;
		createdAt: string;
		lastRunAt?: string;
		stats?: {
			totalRuns: number;
			patientsScreened: number;
			patientsMatched: number;
		};
	}

	interface AgentRunResult {
		eligiblePatients: Array<{
			patientDid: string;
			confidence: number;
			matchedCriteria: number;
			totalCriteria: number;
			details?: string;
		}>;
		summary: {
			screened: number;
			eligible: number;
			eligibilityRate: string;
			averageConfidence: number;
		};
		ranAt: string;
	}

	let trials: Trial[] = $state([]);
	let agentsByTrial: Map<string, Agent[]> = $state(new Map());
	let isLoading = $state(true);
	let error = $state('');
	let searchQuery = $state('');

	let deployingTrialId = $state<string | null>(null);
	let runningAgentDid = $state<string | null>(null);
	let agentResults = $state<Map<string, AgentRunResult>>(new Map());

	// Modal states
	let showDeploymentModal = $state(false);
	let deploymentStatus = $state<'deploying' | 'success' | 'error'>('deploying');
	let deploymentMessage = $state('');
	let deployedAgentDetails = $state<{ agentName: string; agentDid: string; patientsAuthorized: number } | null>(null);

	// Agent run modal states
	let showRunModal = $state(false);
	let runStatus = $state<'running' | 'success' | 'error'>('running');
	let runMessage = $state('');
	let runProgress = $state({ current: 0, total: 0 });

	// Trial details modal states
	let showTrialDetailsModal = $state(false);
	let selectedTrialForDetails = $state<Trial | null>(null);

	onMount(async () => {
		await fetchTrials();
	});

	async function fetchTrials() {
		try {
			isLoading = true;
			error = '';

			const response = await fetch(`${API_BASE}/api/trials/all`);
			if (!response.ok) throw new Error('Failed to fetch trials');

			const data = await response.json();
			trials = data.trials || [];

			// Fetch agents for each trial
			for (const trial of trials) {
				await fetchAgentsForTrial(trial.id);
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load trials';
			console.error('Error fetching trials:', err);
		} finally {
			isLoading = false;
		}
	}

	async function fetchAgentsForTrial(trialId: string) {
		try {
			const response = await fetch(`${API_BASE}/api/trials/${trialId}/agents`);
			if (!response.ok) return;

			const data = await response.json();
			// Create a new Map instance to trigger Svelte 5 reactivity
			const updatedMap = new Map(agentsByTrial);
			updatedMap.set(trialId, data.agents || []);
			agentsByTrial = updatedMap;
		} catch (err) {
			console.error(`Error fetching agents for trial ${trialId}:`, err);
		}
	}

	async function deployAgent(trialId: string, trialName: string) {
		try {
			deployingTrialId = trialId;
			showDeploymentModal = true;
			deploymentStatus = 'deploying';
			deploymentMessage = 'Creating agent identity...';
			error = '';

			const response = await fetch(`${API_BASE}/api/trials/${trialId}/deploy-agent`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ agentName: `${trialName} Agent` })
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to deploy agent');
			}

			const data = await response.json();
			console.log('Agent deployed:', data);

			// Refresh agents list BEFORE showing success modal
			await fetchAgentsForTrial(trialId);

			// Show success state
			deploymentStatus = 'success';
			deploymentMessage = 'Agent deployed successfully!';
			deployedAgentDetails = {
				agentName: data.agent.agentName,
				agentDid: data.agent.agentDid,
				patientsAuthorized: data.patientsAuthorized
			};

			// Auto-close modal after 2 seconds to show the updated button state
			setTimeout(() => {
				closeDeploymentModal();
			}, 2000);
		} catch (err) {
			deploymentStatus = 'error';
			deploymentMessage = err instanceof Error ? err.message : 'Failed to deploy agent';
			error = deploymentMessage;
			console.error('Error deploying agent:', err);
		} finally {
			deployingTrialId = null;
		}
	}

	function closeDeploymentModal() {
		showDeploymentModal = false;
		deployedAgentDetails = null;
	}

	async function runAgent(agentDid: string, trialId: string) {
		try {
			runningAgentDid = agentDid;
			showRunModal = true;
			runStatus = 'running';
			runMessage = 'Scanning patients through TEE...';
			runProgress = { current: 0, total: 0 };
			error = '';

			const response = await fetch(`${API_BASE}/api/agents/${agentDid}/run`, {
				method: 'POST'
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to run agent');
			}

			const data = await response.json();
			console.log('Agent run complete:', data);

			// Fetch full match details (including AI summaries) to enrich results
			let enrichedPatients = data.eligiblePatients;
			try {
				const matchesRes = await fetch(`${API_BASE}/api/pharma/matches`);
				if (matchesRes.ok) {
					const matchesData = await matchesRes.json();
					const detailsMap = new Map<string, string>();
					for (const m of matchesData.matches || []) {
						if (m.trialId === trialId && m.details) {
							detailsMap.set(m.patientDid, m.details);
						}
					}
					enrichedPatients = data.eligiblePatients.map((p: any) => ({
						...p,
						details: detailsMap.get(p.patientDid),
					}));
				}
			} catch (_) { /* non-critical — proceed without details */ }

			// Store results
			const updatedResults = new Map(agentResults);
			updatedResults.set(trialId, {
				eligiblePatients: enrichedPatients,
				summary: data.summary,
				ranAt: data.ranAt
			});
			agentResults = updatedResults;

			// Refresh agents list to update stats BEFORE showing success
			await fetchAgentsForTrial(trialId);

			// Show success state
			runStatus = 'success';
			runMessage = 'Matching complete!';

			// Auto-close modal after 2 seconds to show results
			setTimeout(() => {
				closeRunModal();
			}, 2000);
		} catch (err) {
			runStatus = 'error';
			runMessage = err instanceof Error ? err.message : 'Failed to run agent';
			error = runMessage;
			console.error('Error running agent:', err);
		} finally {
			runningAgentDid = null;
		}
	}

	function closeRunModal() {
		showRunModal = false;
	}

	function openTrialDetails(trial: Trial) {
		selectedTrialForDetails = trial;
		showTrialDetailsModal = true;
	}

	function closeTrialDetailsModal() {
		showTrialDetailsModal = false;
		selectedTrialForDetails = null;
	}

	const filteredTrials = $derived(
		trials.filter((trial) =>
			trial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			trial.sponsor.toLowerCase().includes(searchQuery.toLowerCase()) ||
			trial.indication.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const totalMatches = $derived(
		Array.from(agentResults.values()).reduce((sum, result) => sum + result.summary.eligible, 0)
	);

	const totalScreened = $derived(
		Array.from(agentResults.values()).reduce((sum, result) => sum + result.summary.screened, 0)
	);

	function getTotalCriteria(trial: Trial): number {
		return trial.criteria.inclusion.length + trial.criteria.exclusion.length;
	}

	function getAgentForTrial(trialId: string): Agent | null {
		const agents = agentsByTrial.get(trialId);
		return agents && agents.length > 0 ? agents[0] : null;
	}

	function getResultsForTrial(trialId: string): AgentRunResult | null {
		return agentResults.get(trialId) || null;
	}
</script>

<TopBar title="Published Trials" showSearch={false} userType="pharma" userId="TRIAL-2026-003" />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Header is handled by TopBar and SideNav, but we can add the action here for mobile -->
	<div class="md:hidden flex justify-end mb-4">
		<a href="/pharma/trials/new" class="btn-primary">
			<span class="material-symbols-outlined text-[18px]">add</span>
			Publish New Trial
		</a>
	</div>

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
				<p class="text-on-surface-variant">Loading trials...</p>
			</div>
		</div>
	{:else}
		<!-- Summary Strip -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
			<!-- Card 1 -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Trials</p>
					<p class="text-display-xl text-[var(--color-tm-cyan)] text-glow">{trials.length}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-cyan)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-cyan)] text-[24px]">science</span>
				</div>
			</div>
			
			<!-- Card 2 -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Matches Found</p>
					<p class="text-display-xl text-[var(--color-tm-success)] text-glow">{totalMatches}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[24px]">group</span>
				</div>
			</div>
			
			<!-- Card 3 -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Patients Screened</p>
					<p class="text-display-xl text-[var(--color-tm-warning)] text-glow">{totalScreened}</p>
				</div>
				<div class="w-12 h-12 rounded-full bg-[var(--color-tm-warning)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-warning)] text-[24px]">hourglass_empty</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Trials Table Section -->
	{#if !isLoading}
	<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl inner-glow overflow-hidden flex flex-col">
		<!-- Table Header/Toolbar -->
		<div class="p-stack-md border-b border-[var(--color-tm-border)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--color-tm-surface)]">
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-primary">list_alt</span>
				<h3 class="text-label-md text-on-surface font-semibold">Trial Portfolios</h3>
			</div>
			<div class="relative">
				<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
				<input 
					type="text" 
					bind:value={searchQuery}
					class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg text-label-md text-on-surface pl-9 pr-3 py-1.5 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 w-full sm:w-64 placeholder:text-on-surface-variant" 
					placeholder="Search trials..."
				>
			</div>
		</div>
		
		{#if filteredTrials.length === 0}
			<div class="flex flex-col items-center justify-center py-12 text-on-surface-variant">
				<span class="material-symbols-outlined text-[48px] mb-4">science</span>
				<p class="text-lg">No trials found</p>
				<p class="text-sm mt-2">Create your first trial to get started</p>
				<a href="/pharma/trials/new" class="btn-primary mt-4">
					<span class="material-symbols-outlined text-[18px]">add</span>
					Create Trial
				</a>
			</div>
		{:else}
			<!-- Table Content -->
			<div class="overflow-x-auto">
				<table class="w-full text-left border-collapse">
					<thead>
						<tr class="bg-[var(--color-tm-base)] border-b border-[var(--color-tm-border)]">
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Trial Name</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Phase</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Sponsor</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Criteria</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Matches</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Agent</th>
							<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="text-body-md">
						{#each filteredTrials as trial, i}
							{@const agent = getAgentForTrial(trial.id)}
							{@const results = getResultsForTrial(trial.id)}
							<tr class="border-b border-[var(--color-tm-border)] hover:bg-[var(--color-tm-elevated)] transition-colors group" class:bg-[var(--color-tm-base-alpha)]={i % 2 === 1}>
								<td class="py-3 px-4 font-medium text-on-surface">{trial.name}</td>
								<td class="py-3 px-4">
									<span class="text-[var(--color-tm-{trial.phase === 'Phase III' ? 'success' : trial.phase === 'Phase II' ? 'cyan' : 'warning'})]">
										{trial.phase}
									</span>
								</td>
								<td class="py-3 px-4 text-on-surface-variant">{trial.sponsor}</td>
								<td class="py-3 px-4 text-on-surface-variant">{getTotalCriteria(trial)} criteria</td>
								<td class="py-3 px-4">
									{#if results}
										<span class="font-mono-data text-[var(--color-tm-success)] font-bold">{results.summary.eligible}</span>
										<span class="text-on-surface-variant text-sm"> / {results.summary.screened}</span>
									{:else}
										<span class="text-on-surface-variant">—</span>
									{/if}
								</td>
								<td class="py-3 px-4">
									{#if agent}
										<div class="flex items-center gap-2">
											<div class="w-2 h-2 rounded-full bg-[var(--color-tm-success)]"></div>
											<span class="text-sm text-on-surface-variant">Deployed</span>
										</div>
									{:else}
										<span class="text-on-surface-variant text-sm">Not deployed</span>
									{/if}
								</td>
								<td class="py-3 px-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<button 
											class="btn-ghost py-1 px-3 text-sm flex items-center gap-1"
											onclick={() => openTrialDetails(trial)}
										>
											<span class="material-symbols-outlined text-[16px]">info</span>
											Details
										</button>
										{#if !agent}
											<button 
												class="btn-primary py-1 px-3 text-sm flex items-center gap-1"
												onclick={() => deployAgent(trial.id, trial.name)}
												disabled={deployingTrialId === trial.id}
											>
												{#if deployingTrialId === trial.id}
													<div class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													Deploying...
												{:else}
													<span class="material-symbols-outlined text-[16px]">rocket_launch</span>
													Deploy Agent
												{/if}
											</button>
										{:else}
											<button 
												class="btn-ghost py-1 px-3 text-sm flex items-center gap-1"
												onclick={() => runAgent(agent.agentDid, trial.id)}
												disabled={runningAgentDid === agent.agentDid}
											>
												{#if runningAgentDid === agent.agentDid}
													<div class="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
													Running...
												{:else}
													<span class="material-symbols-outlined text-[16px]">play_arrow</span>
													Run Agent
												{/if}
											</button>
											{#if results}
												<a href="/pharma/matches" class="btn-primary py-1 px-3 text-sm flex items-center gap-1">
													<span class="material-symbols-outlined text-[16px]">visibility</span>
													View Results
												</a>
											{/if}
										{/if}
									</div>
								</td>
							</tr>
							{#if results && agent}
								<tr class="bg-[var(--color-tm-base)] border-b border-[var(--color-tm-border)]">
									<td colspan="7" class="py-4 px-4">
										<div class="space-y-3">
											<div class="flex items-center gap-2 text-sm text-on-surface-variant">
												<span class="material-symbols-outlined text-[18px]">analytics</span>
												<span class="font-medium">Agent Run Results</span>
												<span class="text-xs ml-2">
													{new Date(results.ranAt).toLocaleString()}
												</span>
											</div>
											<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3">
													<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Screened</p>
													<p class="text-2xl font-bold text-on-surface">{results.summary.screened}</p>
												</div>
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3">
													<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Eligible</p>
													<p class="text-2xl font-bold text-[var(--color-tm-success)]">{results.summary.eligible}</p>
												</div>
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3">
													<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Eligibility Rate</p>
													<p class="text-2xl font-bold text-[var(--color-tm-cyan)]">{results.summary.eligibilityRate}</p>
												</div>
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3">
													<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Avg Confidence</p>
													<p class="text-2xl font-bold text-[var(--color-tm-warning)]">
														{(results.summary.averageConfidence * 100).toFixed(0)}%
													</p>
												</div>
											</div>
											{#if results.eligiblePatients.length > 0}
												<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-3">
													<p class="text-sm font-medium text-on-surface mb-2">Eligible Patients</p>
													<div class="space-y-2 max-h-40 overflow-y-auto">
															{#each results.eligiblePatients as patient}
															<div class="text-sm bg-[var(--color-tm-base)] rounded p-3 space-y-2">
																<div class="flex items-center justify-between">
																	<span class="font-mono text-on-surface-variant">{patient.patientDid.slice(0, 20)}...</span>
																	<div class="flex items-center gap-3">
																		<span class="text-on-surface-variant">
																			{patient.matchedCriteria}/{patient.totalCriteria} criteria
																		</span>
																		<span class="text-[var(--color-tm-success)] font-bold">
																			{(patient.confidence * 100).toFixed(0)}%
																		</span>
																		<a 
																			href={`/pharma/messages?trialId=${trial.id}&patientDid=${patient.patientDid}`}
																			class="btn-ghost py-1 px-2 text-xs flex items-center gap-1"
																		>
																			<span class="material-symbols-outlined text-[14px]">chat</span>
																			Contact
																		</a>
																	</div>
																</div>
																{#if patient.details}
																	<p class="text-xs text-on-surface-variant leading-relaxed border-t border-[var(--color-tm-border)] pt-2 mt-1">{@html renderMarkdown(patient.details)}</p>
																{/if}
															</div>
														{/each}
													</div>
												</div>
											{/if}
										</div>
									</td>
								</tr>
							{/if}
						{/each}
					</tbody>
				</table>
			</div>
			
			<!-- Table Footer / Pagination -->
			<div class="p-4 border-t border-[var(--color-tm-border)] bg-[var(--color-tm-base)] flex justify-between items-center text-sm text-on-surface-variant">
				<div>Showing 1 to {filteredTrials.length} of {filteredTrials.length} results</div>
				<div class="flex gap-1">
					<button class="btn-ghost py-1 px-3 opacity-50 cursor-not-allowed">Previous</button>
					<button class="px-3 py-1 border border-primary rounded bg-primary-container/10 text-primary transition-colors">1</button>
					<button class="btn-ghost py-1 px-3 opacity-50 cursor-not-allowed">Next</button>
				</div>
			</div>
		{/if}
	</div>
	{/if}
</main>

<!-- Agent Deployment Modal -->
<Modal bind:isOpen={showDeploymentModal} title="Agent Deployment" size="md" showCloseButton={deploymentStatus !== 'deploying'}>
	<div class="space-y-6">
		{#if deploymentStatus === 'deploying'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-lg font-medium text-on-surface mb-2">Deploying Agent</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm">
					{deploymentMessage}
				</p>
				<div class="mt-6 w-full max-w-sm">
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">verified_user</span>
						<span>Creating cryptographic identity</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">lock</span>
						<span>Authorizing for all patients</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant">
						<span class="material-symbols-outlined text-[18px] text-primary">shield</span>
						<span>Configuring TEE permissions</span>
					</div>
				</div>
			</div>
		{:else if deploymentStatus === 'success'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-[var(--color-tm-success)]/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[40px]">check_circle</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">Agent Deployed Successfully!</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm mb-6">
					Your agent is ready to scan patients for eligible matches.
				</p>

				{#if deployedAgentDetails}
					<div class="w-full bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 space-y-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-on-surface-variant">Agent Name</span>
							<span class="text-sm font-medium text-on-surface">{deployedAgentDetails.agentName}</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-on-surface-variant">Agent DID</span>
							<span class="text-xs font-mono text-on-surface-variant">
								{deployedAgentDetails.agentDid.slice(0, 20)}...
							</span>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm text-on-surface-variant">Patients Authorized</span>
							<span class="text-sm font-bold text-[var(--color-tm-success)]">
								{deployedAgentDetails.patientsAuthorized}
							</span>
						</div>
					</div>
				{/if}

				<button 
					class="btn-primary mt-6 w-full"
					onclick={closeDeploymentModal}
				>
					Done
				</button>
			</div>
		{:else if deploymentStatus === 'error'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-red-500 text-[40px]">error</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">Deployment Failed</p>
				<p class="text-sm text-red-500 text-center max-w-sm mb-6">
					{deploymentMessage}
				</p>

				<button 
					class="btn-ghost w-full"
					onclick={closeDeploymentModal}
				>
					Close
				</button>
			</div>
		{/if}
	</div>
</Modal>

<!-- Trial Details Modal -->
<Modal bind:isOpen={showTrialDetailsModal} title="Trial Details" size="lg" showCloseButton={true}>
	{#if selectedTrialForDetails}
		<div class="space-y-6">
			<!-- Trial Header Info -->
			<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Trial Name</p>
						<p class="text-body-md font-medium text-on-surface">{selectedTrialForDetails.name}</p>
					</div>
					<div>
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Trial ID</p>
						<p class="text-body-md font-mono text-on-surface">{selectedTrialForDetails.id}</p>
					</div>
					<div>
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Phase</p>
						<p class="text-body-md font-medium text-primary">{selectedTrialForDetails.phase}</p>
					</div>
					<div>
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Sponsor</p>
						<p class="text-body-md font-medium text-on-surface">{selectedTrialForDetails.sponsor}</p>
					</div>
					<div class="col-span-2">
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Indication</p>
						<p class="text-body-md font-medium text-on-surface">{selectedTrialForDetails.indication}</p>
					</div>
				</div>
			</div>

			<!-- Description -->
			{#if selectedTrialForDetails.description}
				<div>
					<h3 class="text-headline-sm font-bold text-on-surface mb-3 flex items-center gap-2">
						<span class="material-symbols-outlined text-primary">description</span>
						Description
					</h3>
					<p class="text-body-md text-on-surface-variant leading-relaxed">
						{selectedTrialForDetails.description}
					</p>
				</div>
			{/if}

			<!-- Inclusion Criteria -->
			<div>
				<h3 class="text-headline-sm font-bold text-on-surface mb-3 flex items-center gap-2">
					<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
					Inclusion Criteria ({selectedTrialForDetails.criteria.inclusion.length})
				</h3>
				<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4">
					{#if selectedTrialForDetails.criteria.inclusion.length > 0}
						<ul class="space-y-3">
							{#each selectedTrialForDetails.criteria.inclusion as criterion, idx}
								<li class="flex items-start gap-3">
									<div class="w-6 h-6 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center shrink-0 mt-0.5">
										<span class="text-[var(--color-tm-success)] text-label-sm font-bold">{idx + 1}</span>
									</div>
									<div class="flex-1">
										{#if typeof criterion === 'string'}
											<p class="text-body-md text-on-surface">{criterion}</p>
										{:else}
											<p class="text-body-md text-on-surface">{criterion.description || `${criterion.field}: ${criterion.expected || 'any'}`}</p>
											{#if criterion.field && criterion.description}
												<p class="text-label-sm text-on-surface-variant mt-1">
													Field: <span class="font-mono">{criterion.field}</span>
													{#if criterion.expected}
														• Expected: <span class="font-mono">{criterion.expected}</span>
													{/if}
												</p>
											{/if}
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-body-md text-on-surface-variant">No inclusion criteria specified</p>
					{/if}
				</div>
			</div>

			<!-- Exclusion Criteria -->
			<div>
				<h3 class="text-headline-sm font-bold text-on-surface mb-3 flex items-center gap-2">
					<span class="material-symbols-outlined text-red-500">cancel</span>
					Exclusion Criteria ({selectedTrialForDetails.criteria.exclusion.length})
				</h3>
				<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4">
					{#if selectedTrialForDetails.criteria.exclusion.length > 0}
						<ul class="space-y-3">
							{#each selectedTrialForDetails.criteria.exclusion as criterion, idx}
								<li class="flex items-start gap-3">
									<div class="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
										<span class="text-red-500 text-label-sm font-bold">{idx + 1}</span>
									</div>
									<div class="flex-1">
										{#if typeof criterion === 'string'}
											<p class="text-body-md text-on-surface">{criterion}</p>
										{:else}
											<p class="text-body-md text-on-surface">{criterion.description || `${criterion.field}: ${criterion.expected || 'any'}`}</p>
											{#if criterion.field && criterion.description}
												<p class="text-label-sm text-on-surface-variant mt-1">
													Field: <span class="font-mono">{criterion.field}</span>
													{#if criterion.expected}
														• Expected: <span class="font-mono">{criterion.expected}</span>
													{/if}
												</p>
											{/if}
										{/if}
									</div>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-body-md text-on-surface-variant">No exclusion criteria specified</p>
					{/if}
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-tm-border)]">
				<button 
					class="btn-ghost py-2 px-4"
					onclick={closeTrialDetailsModal}
				>
					Close
				</button>
			</div>
		</div>
	{/if}
</Modal>

<!-- Agent Run Modal -->
<Modal bind:isOpen={showRunModal} title="Agent Matching" size="md" showCloseButton={runStatus !== 'running'}>
	<div class="space-y-6">
		{#if runStatus === 'running'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-lg font-medium text-on-surface mb-2">Scanning Patients</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm">
					{runMessage}
				</p>
				<div class="mt-6 w-full max-w-sm">
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">encrypted</span>
						<span>Processing health records in TEE</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
						<span class="material-symbols-outlined text-[18px] text-primary">psychology</span>
						<span>Evaluating eligibility criteria</span>
					</div>
					<div class="flex items-center gap-2 text-sm text-on-surface-variant">
						<span class="material-symbols-outlined text-[18px] text-primary">shield</span>
						<span>Privacy preserved - no PHI exposed</span>
					</div>
				</div>
			</div>
		{:else if runStatus === 'success'}
			{@const currentResults = Array.from(agentResults.values()).find(r => r)}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-[var(--color-tm-success)]/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[40px]">check_circle</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">Matching Complete!</p>
				<p class="text-sm text-on-surface-variant text-center max-w-sm mb-6">
					Agent has finished screening all patients for eligibility.
				</p>

				{#if currentResults}
					<div class="w-full grid grid-cols-2 gap-3 mb-4">
						<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 text-center">
							<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Screened</p>
							<p class="text-2xl font-bold text-on-surface">{currentResults.summary.screened}</p>
						</div>
						<div class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg p-4 text-center">
							<p class="text-xs text-on-surface-variant uppercase tracking-wider mb-1">Eligible</p>
							<p class="text-2xl font-bold text-[var(--color-tm-success)]">{currentResults.summary.eligible}</p>
						</div>
					</div>
					<div class="w-full bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-4">
						<div class="flex items-center justify-between">
							<span class="text-sm text-on-surface-variant">Eligibility Rate</span>
							<span class="text-lg font-bold text-[var(--color-tm-cyan)]">{currentResults.summary.eligibilityRate}</span>
						</div>
					</div>
				{/if}

				<button 
					class="btn-primary mt-6 w-full"
					onclick={closeRunModal}
				>
					View Results
				</button>
			</div>
		{:else if runStatus === 'error'}
			<div class="flex flex-col items-center justify-center py-8">
				<div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
					<span class="material-symbols-outlined text-red-500 text-[40px]">error</span>
				</div>
				<p class="text-lg font-medium text-on-surface mb-2">Matching Failed</p>
				<p class="text-sm text-red-500 text-center max-w-sm mb-6">
					{runMessage}
				</p>

				<button 
					class="btn-ghost w-full"
					onclick={closeRunModal}
				>
					Close
				</button>
			</div>
		{/if}
	</div>
</Modal>
