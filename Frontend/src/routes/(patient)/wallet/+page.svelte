<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
	import TeeSecuredBadge from '$lib/components/TeeSecuredBadge.svelte';
	import DidCopy from '$lib/components/DidCopy.svelte';
</script>

<TopBar title="Secure Wallet" />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Header Identity Card -->
	<section class="bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-container/20 via-[var(--color-tm-surface)] to-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-2xl p-stack-lg inner-glow relative overflow-hidden">
		<!-- Decorative elements -->
		<div class="absolute top-0 right-0 p-6 opacity-20">
			<span class="material-symbols-outlined text-[120px] text-primary" style="font-variation-settings: 'FILL' 1;">fingerprint</span>
		</div>

		<div class="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
			<div>
				<div class="flex items-center gap-3 mb-2">
					<h2 class="text-headline-md font-bold text-on-surface">Master Identity</h2>
					<TeeSecuredBadge label="TEE Anchored" />
				</div>
				<p class="text-body-md text-on-surface-variant max-w-lg mb-6">This Decentralized Identifier (DID) represents your encrypted clinical profile across the TrialMatch network. Your real name is never exposed.</p>
				
				<div class="bg-surface-container-highest border border-[var(--color-tm-border)] rounded-lg p-3 inline-block">
					<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Global DID</p>
					<div class="text-lg">
						<DidCopy did="did:t3n:p:0x8a9b4c2d7e1f3a5b6c8d9e0f1a2b3c4d" full={true} />
					</div>
				</div>
			</div>
			
			<button class="btn-ghost shrink-0">
				<span class="material-symbols-outlined text-[18px]">qr_code_2</span>
				Show QR Code
			</button>
		</div>
	</section>

	<!-- Credentials Grid -->
	<section>
		<div class="flex items-center justify-between mb-6">
			<div>
				<h3 class="text-headline-md font-bold text-on-surface mb-1">Verified Credentials</h3>
				<p class="text-body-md text-on-surface-variant">Encrypted clinical data points issued by verified institutions.</p>
			</div>
			<button class="btn-primary">
				<span class="material-symbols-outlined text-[18px]">add</span>
				Import Data
			</button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
			<!-- EHR Summary -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
				<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[var(--color-tm-success)]/10 to-transparent"></div>
				<div class="flex justify-between items-start mb-4 relative z-10">
					<div class="w-10 h-10 rounded-lg bg-[var(--color-tm-success)]/10 flex items-center justify-center">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">medical_information</span>
					</div>
					<StatusChip status="Verified" size="sm" />
				</div>
				<h4 class="text-body-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors relative z-10">EHR Summary</h4>
				<p class="text-label-sm text-on-surface-variant mb-4 font-mono-data">Issuer: did:org:mayo_clinic</p>
				<div class="flex justify-between items-center border-t border-outline-variant/30 pt-4 mt-auto relative z-10">
					<span class="text-label-sm text-on-surface-variant">Updated: Oct 12, 2023</span>
					<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">arrow_forward</span>
				</div>
			</div>

			<!-- Genomic Sequence -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
				<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent"></div>
				<div class="flex justify-between items-start mb-4 relative z-10">
					<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
						<span class="material-symbols-outlined text-primary">science</span>
					</div>
					<StatusChip status="Verified" size="sm" />
				</div>
				<h4 class="text-body-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors relative z-10">Genomic Sequence</h4>
				<p class="text-label-sm text-on-surface-variant mb-4 font-mono-data">Issuer: did:org:23andme</p>
				<div class="flex justify-between items-center border-t border-outline-variant/30 pt-4 mt-auto relative z-10">
					<span class="text-label-sm text-on-surface-variant">Updated: Sep 05, 2023</span>
					<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">arrow_forward</span>
				</div>
			</div>

			<!-- Residency Proof -->
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow hover:border-primary/50 transition-colors group cursor-pointer relative overflow-hidden">
				<div class="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[var(--color-tm-success)]/10 to-transparent"></div>
				<div class="flex justify-between items-start mb-4 relative z-10">
					<div class="w-10 h-10 rounded-lg bg-[var(--color-tm-success)]/10 flex items-center justify-center">
						<span class="material-symbols-outlined text-[var(--color-tm-success)]">home_pin</span>
					</div>
					<StatusChip status="Verified" size="sm" />
				</div>
				<h4 class="text-body-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors relative z-10">Proof of Residency</h4>
				<p class="text-label-sm text-on-surface-variant mb-4 font-mono-data">Issuer: did:gov:ca_dmv</p>
				<div class="flex justify-between items-center border-t border-outline-variant/30 pt-4 mt-auto relative z-10">
					<span class="text-label-sm text-on-surface-variant">Updated: Jan 20, 2023</span>
					<span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-[20px]">arrow_forward</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Access Logs -->
	<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow">
		<div class="p-6 border-b border-[var(--color-tm-border)] bg-surface-container-low flex justify-between items-center">
			<div>
				<h3 class="text-label-md font-semibold text-on-surface mb-1">Data Access Logs</h3>
				<p class="text-label-sm text-on-surface-variant">Cryptographic proofs of when your data was queried inside a TEE.</p>
			</div>
			<button class="btn-ghost py-1.5 px-3 text-label-sm">Download CSV</button>
		</div>
		
		<div class="overflow-x-auto">
			<table class="w-full text-left">
				<thead class="bg-surface-container-highest border-b border-[var(--color-tm-border)]">
					<tr>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Timestamp</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Requester</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Data Accessed</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Purpose</th>
						<th class="px-6 py-3 text-label-sm text-on-surface-variant uppercase tracking-wider font-medium">Hash Proof</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[var(--color-tm-border)] text-body-md bg-[var(--color-tm-base)] font-mono-data text-[13px]">
					<tr class="hover:bg-surface-container transition-colors">
						<td class="px-6 py-4 text-on-surface-variant">2023-10-24 14:32:01</td>
						<td class="px-6 py-4 text-primary">did:org:genopharma</td>
						<td class="px-6 py-4 text-on-surface">Genomic Sequence</td>
						<td class="px-6 py-4 text-on-surface-variant">Trial Eligibility Match</td>
						<td class="px-6 py-4 text-on-surface-variant/50">0x7a8...2f1b</td>
					</tr>
					<tr class="hover:bg-surface-container transition-colors">
						<td class="px-6 py-4 text-on-surface-variant">2023-10-23 09:15:44</td>
						<td class="px-6 py-4 text-primary">did:org:nexus_labs</td>
						<td class="px-6 py-4 text-on-surface">EHR Summary</td>
						<td class="px-6 py-4 text-on-surface-variant">Initial Screening</td>
						<td class="px-6 py-4 text-on-surface-variant/50">0x3b2...9c4e</td>
					</tr>
					<tr class="hover:bg-surface-container transition-colors">
						<td class="px-6 py-4 text-on-surface-variant">2023-10-15 11:05:12</td>
						<td class="px-6 py-4 text-primary">did:hosp:mayo_clinic</td>
						<td class="px-6 py-4 text-on-surface">EHR + Genomic</td>
						<td class="px-6 py-4 text-on-surface-variant">Onboarding Sync</td>
						<td class="px-6 py-4 text-on-surface-variant/50">0x1f4...8a7d</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</main>
