<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	import HealthRecordUpload from '$lib/components/HealthRecordUpload.svelte';
	
	onMount(() => {
		// Restore identity and check auth
		identityStore.restore();
		if (!identityStore.isAuthenticated) {
			goto('/login');
		}
	});
</script>

<TopBar title="Dashboard" />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto">
	<!-- Bento Grid Stats -->
	<div class="grid grid-cols-1 md:grid-cols-12 gap-gutter mb-stack-lg">
		<!-- Eligibility Score -->
		<div class="col-span-1 md:col-span-4 bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow relative overflow-hidden flex flex-col justify-between min-h-[160px]">
			<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[var(--color-tm-cyan)]/10 to-transparent pointer-events-none"></div>
			<div>
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Global Eligibility</p>
				<p class="text-display-xl text-primary text-glow">98%</p>
			</div>
			<div class="flex items-center gap-2 mt-4">
				<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[18px]">trending_up</span>
				<span class="text-label-sm text-[var(--color-tm-success)]">+2% from last update</span>
			</div>
		</div>

		<!-- Active Matches -->
		<div class="col-span-1 md:col-span-4 bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex flex-col justify-between min-h-[160px]">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Matches</p>
					<p class="text-display-xl text-on-surface">3</p>
				</div>
				<div class="w-10 h-10 rounded-full bg-[var(--color-tm-indigo)]/10 flex items-center justify-center">
					<span class="material-symbols-outlined text-[var(--color-tm-indigo)]">biotech</span>
				</div>
			</div>
			<a href="/matches" class="text-label-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1 mt-4 w-max">
				View new match details
				<span class="material-symbols-outlined text-[16px]">arrow_forward</span>
			</a>
		</div>

		<!-- Encrypted Data Points -->
		<div class="col-span-1 md:col-span-4 bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex flex-col justify-between min-h-[160px]">
			<div class="flex justify-between items-start">
				<div>
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Secured Data Points</p>
					<p class="text-display-xl text-on-surface font-mono-data tracking-tight">12.4k</p>
				</div>
				<TeeSecuredBadge label="Encrypted" />
			</div>
			<div class="mt-4">
				<div class="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
					<div class="bg-[var(--color-tm-success)] w-full h-full rounded-full"></div>
				</div>
				<p class="text-label-sm text-on-surface-variant mt-2">Fully synchronized with TEE</p>
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
		<!-- Left Column: Health Upload & Live Matches -->
		<div class="lg:col-span-2 flex flex-col gap-gutter">
			<!-- Health Record Upload -->
			<HealthRecordUpload />
			
			<!-- Live Matches -->
			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl inner-glow flex flex-col">
				<div class="p-stack-md border-b border-[var(--color-tm-border)] flex justify-between items-center bg-surface-container-low/50">
					<div class="flex items-center gap-2">
						<span class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] animate-pulse-slow"></span>
						<h3 class="text-label-md font-semibold text-on-surface">Live Match Engine</h3>
					</div>
					<a href="/matches" class="text-label-sm text-on-surface-variant hover:text-primary transition-colors">View All</a>
				</div>
				
				<div class="flex flex-col divide-y divide-[var(--color-tm-border)]">
					<!-- Match Item 1 -->
					<div class="p-4 hover:bg-surface-container transition-colors group flex items-start gap-4">
						<div class="w-10 h-10 rounded-lg bg-[var(--color-tm-cyan)]/10 border border-[var(--color-tm-cyan)]/20 flex items-center justify-center shrink-0 mt-1">
							<span class="text-label-md font-bold text-primary">94%</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-start mb-1">
								<h4 class="text-body-md font-medium text-on-surface truncate pr-4 group-hover:text-primary transition-colors cursor-pointer">Phase III NSCLC Immunotherapy</h4>
								<StatusChip status="Eligible" size="sm" />
							</div>
							<p class="text-label-sm text-on-surface-variant truncate mb-2">GenoPharma Inc. &bull; University College Hospital</p>
							<div class="flex flex-wrap gap-2">
								<span class="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-outline-variant text-on-surface-variant">Biomarker: PD-L1</span>
								<span class="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-outline-variant text-on-surface-variant">Stage: 3A/B</span>
							</div>
						</div>
						<a href="/trial/1" class="shrink-0 text-on-surface-variant hover:text-primary transition-colors p-2 mt-1">
							<span class="material-symbols-outlined text-[20px]">chevron_right</span>
						</a>
					</div>
					
					<!-- Match Item 2 -->
					<div class="p-4 hover:bg-surface-container transition-colors group flex items-start gap-4">
						<div class="w-10 h-10 rounded-lg bg-[var(--color-tm-indigo)]/10 border border-[var(--color-tm-indigo)]/20 flex items-center justify-center shrink-0 mt-1">
							<span class="text-label-md font-bold text-[var(--color-tm-indigo)]">88%</span>
						</div>
						<div class="flex-1 min-w-0">
							<div class="flex justify-between items-start mb-1">
								<h4 class="text-body-md font-medium text-on-surface truncate pr-4 group-hover:text-primary transition-colors cursor-pointer">Advanced Melanoma Combination</h4>
								<StatusChip status="Reviewing" size="sm" />
							</div>
							<p class="text-label-sm text-on-surface-variant truncate mb-2">Nexus Labs &bull; Mayo Clinic</p>
							<div class="flex flex-wrap gap-2">
								<span class="text-[10px] font-mono-data px-1.5 py-0.5 rounded border border-outline-variant text-on-surface-variant">BRAF V600E</span>
							</div>
						</div>
						<a href="/trial/2" class="shrink-0 text-on-surface-variant hover:text-primary transition-colors p-2 mt-1">
							<span class="material-symbols-outlined text-[20px]">chevron_right</span>
						</a>
					</div>
				</div>
			</section>
		</div>

		<!-- Right Column: System Status & Audit -->
		<div class="flex flex-col gap-gutter">
			<!-- TEE Node Status Widget -->
			<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow">
				<h3 class="text-label-sm font-semibold text-on-surface uppercase tracking-wider mb-4">Enclave Status</h3>
				
				<div class="flex items-center gap-4 mb-6">
					<div class="relative w-12 h-12">
						<div class="absolute inset-0 rounded-full border-2 border-[var(--color-tm-success)]/30 animate-[spin-slow_4s_linear_infinite]"></div>
						<div class="absolute inset-1 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center">
							<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[20px]">shield_locked</span>
						</div>
					</div>
					<div>
						<p class="text-label-md font-semibold text-[var(--color-tm-success)]">Secure Connection Active</p>
						<p class="text-mono-data text-[11px] text-on-surface-variant">Node: sgx-eu-west-1a</p>
					</div>
				</div>
				
				<div class="space-y-3">
					<div class="flex justify-between text-label-sm">
						<span class="text-on-surface-variant">Data Encrypted</span>
						<span class="text-on-surface font-mono-data">AES-256-GCM</span>
					</div>
					<div class="flex justify-between text-label-sm">
						<span class="text-on-surface-variant">Last Sync</span>
						<span class="text-on-surface font-mono-data">2 mins ago</span>
					</div>
					<div class="flex justify-between text-label-sm">
						<span class="text-on-surface-variant">Attestation</span>
						<span class="text-[var(--color-tm-success)] font-mono-data">Valid</span>
					</div>
				</div>
			</section>

			<!-- Mini Audit Log -->
			<section class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-xl flex flex-col h-full bg-noise">
				<div class="p-3 border-b border-[var(--color-tm-border)] flex justify-between items-center bg-surface-container/50">
					<h3 class="text-label-sm font-semibold text-on-surface font-mono-data">_audit_tail</h3>
					<a href="/audit" class="text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Expand</a>
				</div>
				<div class="p-3 flex-1 font-mono-data text-[11px] space-y-2 overflow-y-auto max-h-[200px] text-on-surface-variant">
					<div class="flex gap-2">
						<span class="text-on-surface-variant/50">[14:32:01]</span>
						<span class="text-[var(--color-tm-success)]">MATCH_EVAL</span>
						<span class="truncate">Phase III NSCLC -> 94%</span>
					</div>
					<div class="flex gap-2">
						<span class="text-on-surface-variant/50">[14:31:45]</span>
						<span class="text-primary">DATA_SYNC</span>
						<span class="truncate">EHR_Vitals updated</span>
					</div>
					<div class="flex gap-2">
						<span class="text-on-surface-variant/50">[12:15:22]</span>
						<span class="text-[var(--color-tm-warning)]">REQ_ACCESS</span>
						<span class="truncate">Hospital_Node_A pending</span>
					</div>
					<div class="flex gap-2">
						<span class="text-on-surface-variant/50">[10:05:11]</span>
						<span class="text-[var(--color-tm-success)]">LOGIN_OK</span>
						<span class="truncate">Session started</span>
					</div>
				</div>
			</section>
		</div>
	</div>
</main>
