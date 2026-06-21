<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import { identityStore } from '$lib/stores/identity.svelte';
	
	let activeFilter = $state('all');
</script>

<TopBar title="Audit Log" userType="patient" userId={identityStore.patientDid || ''} />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg flex flex-col h-[calc(100vh-64px)]">
	
	<div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
		<div>
			<h2 class="text-headline-md font-bold text-on-surface">Secure Ledger Audit</h2>
			<p class="text-body-md text-on-surface-variant">Cryptographic proof of all operations performed inside the TEE enclave.</p>
		</div>
		<button class="btn-ghost flex items-center gap-2">
			<span class="material-symbols-outlined text-[18px]">download</span>
			Export Log
		</button>
	</div>

	<!-- Filters -->
	<div class="flex items-center gap-2 overflow-x-auto pb-2 shrink-0 border-b border-[var(--color-tm-border)]">
		<button class="px-4 py-2 rounded-full text-label-sm font-medium whitespace-nowrap {activeFilter === 'all' ? 'bg-primary text-[var(--color-tm-base)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'} transition-colors" onclick={() => activeFilter = 'all'}>All Events</button>
		<button class="px-4 py-2 rounded-full text-label-sm font-medium whitespace-nowrap {activeFilter === 'auth' ? 'bg-[var(--color-tm-success)] text-[var(--color-tm-base)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'} transition-colors" onclick={() => activeFilter = 'auth'}>Authentication</button>
		<button class="px-4 py-2 rounded-full text-label-sm font-medium whitespace-nowrap {activeFilter === 'match' ? 'bg-[var(--color-tm-cyan)] text-[var(--color-tm-base)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'} transition-colors" onclick={() => activeFilter = 'match'}>Match Evaluations</button>
		<button class="px-4 py-2 rounded-full text-label-sm font-medium whitespace-nowrap {activeFilter === 'sync' ? 'bg-[var(--color-tm-indigo)] text-[var(--color-tm-base)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'} transition-colors" onclick={() => activeFilter = 'sync'}>Data Syncs</button>
		<button class="px-4 py-2 rounded-full text-label-sm font-medium whitespace-nowrap {activeFilter === 'access' ? 'bg-[var(--color-tm-warning)] text-[var(--color-tm-base)]' : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface'} transition-colors" onclick={() => activeFilter = 'access'}>Access Requests</button>
	</div>

	<!-- Log Table (Full height) -->
	<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow flex-1 flex flex-col min-h-0">
		<div class="overflow-y-auto flex-1 font-mono-data text-[13px]">
			<table class="w-full text-left">
				<thead class="bg-surface-container-highest border-b border-[var(--color-tm-border)] sticky top-0 z-10 shadow-sm">
					<tr>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Timestamp (UTC)</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Event Type</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Actor DID</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Details</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium text-right">Ledger Hash</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-tm-border)] bg-[var(--color-tm-base)] text-on-surface-variant">
					<!-- Row 1 -->
					<tr class="hover:bg-surface-container transition-colors cursor-pointer group">
						<td class="px-6 py-4 whitespace-nowrap">2023-10-24 14:32:01.442</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[var(--color-tm-cyan)]/10 text-[var(--color-tm-cyan)] border border-[var(--color-tm-cyan)]/20">MATCH_EVAL</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">did:t3n:agent:0x...</td>
						<td class="px-6 py-4 text-on-surface">Evaluated trial NCT04839201. Result: 94% Match.</td>
						<td class="px-6 py-4 text-right opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">0x7a8b...2f1b</td>
					</tr>
					<!-- Row 2 -->
					<tr class="hover:bg-surface-container transition-colors cursor-pointer group">
						<td class="px-6 py-4 whitespace-nowrap">2023-10-24 14:31:45.109</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[var(--color-tm-indigo)]/10 text-[var(--color-tm-indigo)] border border-[var(--color-tm-indigo)]/20">DATA_SYNC</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">did:t3n:hosp:0x7b...</td>
						<td class="px-6 py-4 text-on-surface">Updated EHR_Vitals block. Signed by UCH node.</td>
						<td class="px-6 py-4 text-right opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">0x3b2c...9c4e</td>
					</tr>
					<!-- Row 3 -->
					<tr class="hover:bg-surface-container transition-colors cursor-pointer group">
						<td class="px-6 py-4 whitespace-nowrap">2023-10-24 10:05:11.882</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[var(--color-tm-success)]/10 text-[var(--color-tm-success)] border border-[var(--color-tm-success)]/20">AUTH_OK</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap text-on-surface">did:t3n:p:0x8a...</td>
						<td class="px-6 py-4 text-on-surface">Patient authenticated to Enclave via PIN.</td>
						<td class="px-6 py-4 text-right opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">0x1f4d...8a7d</td>
					</tr>
					<!-- Row 4 -->
					<tr class="hover:bg-surface-container transition-colors cursor-pointer group bg-[var(--color-tm-warning)]/5">
						<td class="px-6 py-4 whitespace-nowrap">2023-10-23 09:15:22.001</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-[var(--color-tm-warning)]/10 text-[var(--color-tm-warning)] border border-[var(--color-tm-warning)]/20">REQ_ACCESS</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">did:t3n:org:0x2f...</td>
						<td class="px-6 py-4 text-on-surface">GenoPharma requested contact decryption. Pending.</td>
						<td class="px-6 py-4 text-right opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">0x5e6f...1b2c</td>
					</tr>
					<!-- Row 5 -->
					<tr class="hover:bg-surface-container transition-colors cursor-pointer group">
						<td class="px-6 py-4 whitespace-nowrap">2023-10-20 16:40:05.112</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-surface-container-high text-on-surface-variant border border-outline-variant">SYS_INIT</span>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">did:t3n:sys:node...</td>
						<td class="px-6 py-4 text-on-surface">TEE Enclave spun up. Integrity verified.</td>
						<td class="px-6 py-4 text-right opacity-50 group-hover:opacity-100 group-hover:text-primary transition-all">0x9a8b...7c6d</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</main>
