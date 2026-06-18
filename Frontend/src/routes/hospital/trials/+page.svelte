<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	import DidCopy from '$lib/components/DidCopy.svelte';
	
	let activeTab = $state('all');
</script>

<TopBar title="Clinical Trial Coordinator" />

<main class="flex-1 p-margin-desktop max-w-[1440px] mx-auto w-full">
	
	<!-- Header Section -->
	<div class="flex justify-between items-end mb-stack-lg">
		<div>
			<h2 class="text-headline-md font-bold text-on-surface mb-2">Trial Review Queue</h2>
			<p class="text-body-md text-on-surface-variant max-w-2xl">Review patients who have expressed interest. All eligibility criteria are verified via TEE.</p>
		</div>
		<button class="flex items-center space-x-2 border border-outline-variant text-outline hover:border-primary hover:text-on-background px-4 py-2 rounded-lg transition-all text-label-md bg-transparent">
			<span class="material-symbols-outlined text-[18px]">refresh</span>
			<span>Refresh Queue</span>
		</button>
	</div>

	<!-- Tabs -->
	<div class="flex space-x-6 border-b border-outline-variant mb-stack-lg">
		<button class="pb-3 px-1 text-label-md font-semibold transition-colors relative {activeTab === 'all' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}" onclick={() => activeTab = 'all'}>
			All (42)
			{#if activeTab === 'all'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
			{/if}
		</button>
		<button class="pb-3 px-1 text-label-md font-semibold transition-colors relative {activeTab === 'pending' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}" onclick={() => activeTab = 'pending'}>
			Pending (8)
			{#if activeTab === 'pending'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
			{/if}
		</button>
		<button class="pb-3 px-1 text-label-md font-semibold transition-colors relative {activeTab === 'review' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}" onclick={() => activeTab = 'review'}>
			Under Review (15)
			{#if activeTab === 'review'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
			{/if}
		</button>
		<button class="pb-3 px-1 text-label-md font-semibold transition-colors relative {activeTab === 'completed' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}" onclick={() => activeTab = 'completed'}>
			Completed (19)
			{#if activeTab === 'completed'}
				<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
			{/if}
		</button>
	</div>

	<!-- Review List (Table) -->
	<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow relative">
		<!-- Decorative subtle mesh gradient background -->
		<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-[var(--color-tm-surface)] to-[var(--color-tm-surface)] pointer-events-none opacity-50"></div>
		
		<div class="overflow-x-auto relative z-10">
			<table class="w-full text-left">
				<thead class="bg-surface-container-low border-b border-[var(--color-tm-border)]">
					<tr>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Patient ID</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Trial Name</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Match Score</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Expressed Date</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Attestation</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Status</th>
						<th class="px-6 py-4 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium text-right">Action</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-tm-border)]">
					<!-- Row 1: Pending -->
					<tr class="hover:bg-surface-container-highest transition-colors group">
						<td class="px-6 py-4">
							<DidCopy did="did:p:0x9a...3f21" />
						</td>
						<td class="px-6 py-4 text-body-md text-on-surface font-medium">Phase III NSCLC Immunotherapy</td>
						<td class="px-6 py-4">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">94% Match</span>
						</td>
						<td class="px-6 py-4 text-body-md text-on-surface-variant">Oct 24, 2023 14:32</td>
						<td class="px-6 py-4">
							<TeeSecuredBadge label="Verified" />
						</td>
						<td class="px-6 py-4">
							<StatusChip status="Pending" size="sm" />
						</td>
						<td class="px-6 py-4 text-right">
							<button class="bg-primary text-background text-label-md font-semibold px-3 py-1.5 rounded-lg hover:bg-primary-fixed-dim transition-colors">Review Details</button>
						</td>
					</tr>
					
					<!-- Row 2: Reviewing -->
					<tr class="hover:bg-surface-container-highest transition-colors group">
						<td class="px-6 py-4">
							<DidCopy did="did:p:0x2b...8e14" />
						</td>
						<td class="px-6 py-4 text-body-md text-on-surface font-medium">Advanced Melanoma Combination Therapy</td>
						<td class="px-6 py-4">
							<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">88% Match</span>
						</td>
						<td class="px-6 py-4 text-body-md text-on-surface-variant">Oct 23, 2023 09:15</td>
						<td class="px-6 py-4">
							<TeeSecuredBadge label="Verified" />
						</td>
						<td class="px-6 py-4">
							<StatusChip status="Reviewing" size="sm" />
						</td>
						<td class="px-6 py-4 text-right">
							<button class="btn-ghost py-1.5">Continue</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>

	<!-- Pagination -->
	<div class="flex items-center justify-between mt-6">
		<span class="text-label-sm text-on-surface-variant">Showing 1 to 2 of 42 entries</span>
		<div class="flex space-x-2">
			<button class="p-1.5 rounded border border-outline-variant text-on-surface-variant disabled:opacity-50" disabled>
				<span class="material-symbols-outlined text-[18px]">chevron_left</span>
			</button>
			<button class="p-1.5 rounded border border-outline-variant text-on-surface hover:border-primary hover:text-primary transition-colors">
				<span class="material-symbols-outlined text-[18px]">chevron_right</span>
			</button>
		</div>
	</div>
</main>
