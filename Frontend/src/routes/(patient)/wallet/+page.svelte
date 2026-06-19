<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	import DidCopy from '$lib/components/DidCopy.svelte';
	import { API_BASE } from '$lib/config';

	interface AccessLog {
		timestamp: string;
		requester: string;
		requesterName: string;
		trialId: string;
		trialName: string;
		action: string;
		purpose: string;
		hashProof?: string;
	}

	let accessLogs = $state<AccessLog[]>([]);
	let isLoadingLogs = $state(true);

	onMount(async () => {
		// Restore identity and check auth
		identityStore.restore();
		if (!identityStore.isAuthenticated) {
			goto('/login');
			return;
		}

		// Fetch access logs
		await fetchAccessLogs();
	});

	async function fetchAccessLogs() {
		if (!identityStore.patientDid) return;

		try {
			isLoadingLogs = true;

			const response = await fetch(
				`${API_BASE}/api/access-logs?patientDid=${encodeURIComponent(identityStore.patientDid)}&limit=20`
			);

			if (!response.ok) throw new Error('Failed to fetch access logs');

			const data = await response.json();
			accessLogs = data.logs || [];
		} catch (error) {
			console.error('Error fetching access logs:', error);
			accessLogs = [];
		} finally {
			isLoadingLogs = false;
		}
	}

	function formatTimestamp(timestamp: string): string {
		return new Date(timestamp).toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	}

	function getActionLabel(action: string): string {
		switch (action) {
			case 'authorization':
				return 'Agent Authorized';
			case 'eligibility_check':
				return 'Eligibility Check';
			case 'match_evaluation':
				return 'Match Evaluation';
			default:
				return action;
		}
	}
</script>

<TopBar title="Secure Wallet" showSearch={false} />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Header Identity Card -->
	<section class="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-container/20 via-[var(--color-tm-surface)] to-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-2xl p-stack-lg inner-glow relative overflow-hidden">
		<!-- Decorative elements -->
		<div class="absolute top-0 right-0 p-6 opacity-20">
			<span class="material-symbols-outlined text-[120px] text-primary" style="font-variation-settings: 'FILL' 1;">fingerprint</span>
		</div>

		<div class="relative z-10">
			<div class="flex items-center gap-3 mb-2">
				<h2 class="text-headline-md font-bold text-on-surface">Master Identity</h2>
				<TeeSecuredBadge label="TEE Anchored" />
			</div>
			<p class="text-body-md text-on-surface-variant max-w-lg mb-6">
				This Decentralized Identifier (DID) represents your encrypted clinical profile across the TrialMatch network. Your real name is never exposed.
			</p>
			
			<div class="bg-surface-container-highest border border-[var(--color-tm-border)] rounded-lg p-3 inline-block">
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Your DID</p>
				<div class="text-lg">
					{#if identityStore.patientDid}
						<DidCopy did={identityStore.patientDid} full={true} />
					{:else}
						<span class="text-on-surface-variant">Loading...</span>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Access Logs -->
	<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow">
		<div class="p-6 border-b border-[var(--color-tm-border)] bg-surface-container-low flex justify-between items-center">
			<div>
				<h3 class="text-label-md font-semibold text-on-surface mb-1">Data Access Logs</h3>
				<p class="text-label-sm text-on-surface-variant">
					Records of agent authorizations and data access events inside the TEE.
				</p>
			</div>
		</div>
		
		{#if isLoadingLogs}
			<div class="p-12 flex justify-center items-center">
				<div class="flex items-center gap-3">
					<div class="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
					<p class="text-body-md text-on-surface-variant">Loading access logs...</p>
				</div>
			</div>
		{:else if accessLogs.length === 0}
			<div class="p-12 flex flex-col items-center justify-center text-center">
				<span class="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">lock</span>
				<p class="text-body-lg text-on-surface mb-2">No Access Events Yet</p>
				<p class="text-label-sm text-on-surface-variant max-w-md">
					When agents are authorized to access your data for trial matching, they will appear here.
				</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left">
					<thead class="bg-surface-container-highest border-b border-[var(--color-tm-border)]">
						<tr>
							<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Timestamp</th>
							<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Agent / Requester</th>
							<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Trial</th>
							<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Action</th>
							<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Purpose</th>
							{#if accessLogs.some(log => log.hashProof)}
								<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Hash Proof</th>
							{/if}
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--color-tm-border)] text-body-md bg-[var(--color-tm-base)] font-mono-data text-[13px]">
						{#each accessLogs as log}
							<tr class="hover:bg-surface-container transition-colors">
								<td class="px-6 py-4 text-on-surface-variant">{formatTimestamp(log.timestamp)}</td>
								<td class="px-6 py-4">
									<div>
										<p class="text-on-surface">{log.requesterName}</p>
										<p class="text-primary text-[11px] truncate max-w-xs">{log.requester}</p>
									</div>
								</td>
								<td class="px-6 py-4">
									<div>
										<p class="text-on-surface">{log.trialName}</p>
										<p class="text-on-surface-variant text-[11px]">{log.trialId}</p>
									</div>
								</td>
								<td class="px-6 py-4">
									<span class="text-[var(--color-tm-{log.action === 'authorization' ? 'success' : 'cyan'})]">
										{getActionLabel(log.action)}
									</span>
								</td>
								<td class="px-6 py-4 text-on-surface-variant">{log.purpose}</td>
								{#if log.hashProof}
									<td class="px-6 py-4 text-on-surface-variant/50">{log.hashProof}</td>
								{:else if accessLogs.some(l => l.hashProof)}
									<td class="px-6 py-4 text-on-surface-variant/50">—</td>
								{/if}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</main>
