<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
</script>

<TopBar title="Trial Detail" />

<div class="bg-[var(--color-tm-surface)] border-b border-[var(--color-tm-border)] sticky top-16 z-30 shadow-sm">
	<div class="max-w-[1280px] mx-auto px-margin-desktop py-4 flex items-center justify-between">
		<a href="/matches" class="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-label-md">
			<span class="material-symbols-outlined text-[18px]">arrow_back</span>
			Back to Matches
		</a>
		<div class="flex items-center gap-3">
			<a href="/matches" class="btn-ghost py-1.5 px-4 text-center">Decline</a>
			<a href="/matches" class="btn-primary py-1.5 px-4 text-center">Express Interest</a>
		</div>
	</div>
</div>

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Header Section -->
	<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-lg inner-glow">
		<div class="flex flex-col md:flex-row justify-between gap-6 mb-8">
			<div class="flex-1">
				<div class="flex flex-wrap items-center gap-3 mb-3">
					<StatusChip status="Eligible" />
					<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">NCT04839201</span>
					<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">Phase III</span>
				</div>
				<h1 class="text-headline-lg font-bold text-on-surface mb-4 max-w-3xl">Phase III NSCLC Immunotherapy Trial</h1>
				<p class="text-body-lg text-on-surface-variant max-w-4xl">A randomized, double-blind study evaluating the efficacy and safety of a novel PD-L1 inhibitor in patients with advanced non-small cell lung cancer.</p>
			</div>
			
			<div class="md:w-64 shrink-0 bg-surface-container-low rounded-lg p-4 border border-[var(--color-tm-border)]">
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">TEE Match Score</p>
				<div class="flex items-baseline gap-2 mb-2">
					<span class="text-display-xl font-bold text-primary leading-none text-glow">94%</span>
				</div>
				<TeeSecuredBadge label="14/14 Criteria Met" />
			</div>
		</div>
		
		<div class="flex flex-wrap gap-6 pt-6 border-t border-[var(--color-tm-border)]">
			<div>
				<p class="text-label-sm text-on-surface-variant mb-1">Sponsor</p>
				<p class="text-body-md text-on-surface font-medium flex items-center gap-1">
					<span class="material-symbols-outlined text-[16px] text-on-surface-variant">science</span>
					GenoPharma Inc.
				</p>
			</div>
			<div>
				<p class="text-label-sm text-on-surface-variant mb-1">Principal Investigator</p>
				<p class="text-body-md text-on-surface font-medium">Dr. Sarah Jenkins, MD</p>
			</div>
			<div>
				<p class="text-label-sm text-on-surface-variant mb-1">Nearest Location</p>
				<p class="text-body-md text-on-surface font-medium flex items-center gap-1">
					<span class="material-symbols-outlined text-[16px] text-on-surface-variant">location_on</span>
					University College Hospital (12m)
				</p>
			</div>
		</div>
	</section>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
		<!-- Left: Eligibility Breakdown -->
		<div class="lg:col-span-2 space-y-stack-lg">
			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
				<div class="flex items-center justify-between mb-6">
					<h3 class="text-headline-md font-bold text-on-surface">Eligibility Breakdown</h3>
					<span class="text-label-sm text-on-surface-variant bg-surface-container px-2 py-1 rounded">Secured by TEE</span>
				</div>
				
				<div class="space-y-4">
					<!-- Met Criterion -->
					<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
						<div>
							<h4 class="text-body-md font-medium text-on-surface mb-1">Age 18 to 75 years</h4>
							<p class="text-label-sm text-on-surface-variant">Verified via encrypted DID profile (Date of Birth claim).</p>
						</div>
					</div>
					<!-- Met Criterion -->
					<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
						<div>
							<h4 class="text-body-md font-medium text-on-surface mb-1">Histologically confirmed NSCLC</h4>
							<p class="text-label-sm text-on-surface-variant">Verified via EHR Summary (SNOMED-CT: 254637007).</p>
						</div>
					</div>
					<!-- Met Criterion -->
					<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
						<div>
							<h4 class="text-body-md font-medium text-on-surface mb-1">PD-L1 Expression ≥ 50%</h4>
							<p class="text-label-sm text-on-surface-variant">Verified via Genomic Sequence credential.</p>
						</div>
					</div>
					<!-- Met Criterion -->
					<div class="flex gap-4 p-4 rounded-lg bg-[var(--color-tm-success)]/5 border border-[var(--color-tm-success)]/20">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
						<div>
							<h4 class="text-body-md font-medium text-on-surface mb-1">No prior systemic therapy for metastatic disease</h4>
							<p class="text-label-sm text-on-surface-variant">Verified via zero-knowledge proof against EHR treatment history.</p>
						</div>
					</div>
				</div>
			</section>

			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
				<h3 class="text-headline-md font-bold text-on-surface mb-4">About This Trial</h3>
				<div class="prose prose-invert max-w-none text-body-md text-on-surface-variant">
					<p>This study evaluates the efficacy and safety of a novel PD-L1 inhibitor compared to standard of care chemotherapy in patients with previously untreated advanced non-small cell lung cancer (NSCLC) with high PD-L1 expression.</p>
					<p>Patients will be randomized 1:1 to receive either the investigational drug or investigator's choice of platinum-based chemotherapy. The primary endpoint is overall survival (OS).</p>
					<h4 class="text-on-surface mt-6 mb-2 font-semibold">Treatment Arms</h4>
					<ul class="list-disc pl-5 space-y-1">
						<li>Experimental: Novel PD-L1 Inhibitor (IV infusion every 3 weeks)</li>
						<li>Active Comparator: Platinum-based chemotherapy (IV infusion every 3 weeks)</li>
					</ul>
				</div>
			</section>
		</div>

		<!-- Right: Actions & Privacy -->
		<div class="space-y-stack-md">
			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow text-center">
				<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
					<span class="material-symbols-outlined text-primary text-[24px]" style="font-variation-settings: 'FILL' 1;">front_hand</span>
				</div>
				<h3 class="text-headline-md font-bold text-on-surface mb-2">Interested?</h3>
				<p class="text-body-md text-on-surface-variant mb-6">Expressing interest will securely share your contact info with the hospital coordinator. Your raw medical data remains encrypted.</p>
				<a href="/matches" class="btn-primary w-full py-3 mb-3 text-center block">Express Interest</a>
				<a href="/matches" class="text-label-sm text-on-surface-variant hover:text-primary transition-colors block mt-2">I'm not interested in this trial</a>
			</section>

			<section class="bg-surface-container-low border border-[var(--color-tm-border)] rounded-xl p-4">
				<h4 class="text-label-md font-semibold text-on-surface flex items-center gap-2 mb-3">
					<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[18px]">verified_user</span>
					Privacy Guarantee
				</h4>
				<p class="text-label-sm text-on-surface-variant mb-3">This match was calculated inside a Trusted Execution Environment.</p>
				<ul class="space-y-2 text-label-sm text-on-surface-variant">
					<li class="flex items-start gap-2">
						<span class="material-symbols-outlined text-[14px] mt-0.5">close</span>
						GenoPharma does not know you matched.
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
</main>
