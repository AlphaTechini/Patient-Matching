<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
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
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Highly Compatible</p>
			<p class="text-headline-lg font-bold text-primary">3</p>
		</div>
		<div class="pl-4 border-l-2 border-[var(--color-tm-warning)]">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pending Review</p>
			<p class="text-headline-lg font-bold text-on-surface">1</p>
		</div>
		<div class="pl-4 border-l-2 border-[var(--color-tm-success)]">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Enrolled</p>
			<p class="text-headline-lg font-bold text-on-surface">0</p>
		</div>
		<div class="pl-4 border-l-2 border-outline-variant/30">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Not Eligible</p>
			<p class="text-headline-lg font-bold text-on-surface-variant">12</p>
		</div>
	</div>

	<!-- Match Cards List -->
	<div class="space-y-6">
		
		<!-- Trial Card 1: Eligible -->
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-primary/50 transition-colors relative overflow-hidden group">
			<!-- Subtle glow effect behind card -->
			<div class="absolute -inset-px bg-gradient-to-r from-primary/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
			
			<div class="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
				<!-- Left side: Info -->
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<StatusChip status="Eligible" />
						<span class="text-label-sm text-on-surface-variant">Phase III &bull; Oncology</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-2">Phase III NSCLC Immunotherapy Trial</h3>
					<p class="text-body-md text-on-surface-variant mb-4 max-w-3xl">A randomized, double-blind study evaluating the efficacy and safety of a novel PD-L1 inhibitor in patients with advanced non-small cell lung cancer.</p>
					
					<div class="flex flex-wrap gap-2 mb-4">
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
							<span class="material-symbols-outlined text-[14px]">science</span>
							GenoPharma Inc.
						</span>
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
							<span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_hospital</span>
							University College Hospital
						</span>
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
							<span class="material-symbols-outlined text-[14px]">location_on</span>
							London, UK (12 miles)
						</span>
					</div>
				</div>
				
				<!-- Right side: Score & Action -->
				<div class="lg:w-64 shrink-0 flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[var(--color-tm-border)] pt-4 lg:pt-0 lg:pl-6">
					<div class="text-left lg:text-right w-full mb-4 lg:mb-0">
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">TEE Match Score</p>
						<div class="flex items-end lg:justify-end gap-2">
							<span class="text-display-xl font-bold text-primary leading-none text-glow">94%</span>
						</div>
						<div class="mt-2 flex lg:justify-end">
							<TeeSecuredBadge label="14 criteria met" />
						</div>
					</div>
					
					<div class="flex flex-col sm:flex-row lg:flex-col gap-2 w-full mt-4">
						<a href="/trial/1" class="btn-primary w-full justify-center">Review Trial Details</a>
						<button class="btn-ghost w-full justify-center">Express Interest</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Trial Card 2: Reviewing -->
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-[var(--color-tm-indigo)]/50 transition-colors relative overflow-hidden group">
			<div class="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<StatusChip status="Reviewing" />
						<span class="text-label-sm text-on-surface-variant">Phase II &bull; Oncology</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-2">Advanced Melanoma Combination Therapy</h3>
					<p class="text-body-md text-on-surface-variant mb-4 max-w-3xl">Evaluating safety and tolerability of combination therapy in patients with BRAF V600E mutated unresectable melanoma.</p>
					
					<div class="flex flex-wrap gap-2 mb-4">
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
							<span class="material-symbols-outlined text-[14px]">science</span>
							Nexus Labs
						</span>
						<span class="inline-flex items-center gap-1 px-2 py-1 rounded bg-surface-container border border-[var(--color-tm-border)] text-label-sm text-on-surface-variant">
							<span class="material-symbols-outlined text-[14px]" style="font-variation-settings: 'FILL' 1;">local_hospital</span>
							Mayo Clinic
						</span>
					</div>
				</div>
				
				<div class="lg:w-64 shrink-0 flex flex-col justify-between items-start lg:items-end border-t lg:border-t-0 lg:border-l border-[var(--color-tm-border)] pt-4 lg:pt-0 lg:pl-6">
					<div class="text-left lg:text-right w-full mb-4 lg:mb-0">
						<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">TEE Match Score</p>
						<div class="flex items-end lg:justify-end gap-2">
							<span class="text-display-xl font-bold text-[var(--color-tm-indigo)] leading-none text-glow">88%</span>
						</div>
						<div class="mt-2 flex lg:justify-end">
							<TeeSecuredBadge label="1 missing test" />
						</div>
					</div>
					<a href="/trial/2" class="btn-ghost w-full justify-center">View Missing Criteria</a>
				</div>
			</div>
		</div>
		
	</div>
</main>
