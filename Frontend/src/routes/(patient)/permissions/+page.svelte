<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import { identityStore } from '$lib/stores/identity.svelte';
</script>

<TopBar title="Agent Permissions" userType="patient" userId={identityStore.patientDid || ''} />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Intro Banner -->
	<div class="bg-[var(--color-tm-indigo)]/10 border border-[var(--color-tm-indigo)]/20 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
		<div class="w-12 h-12 rounded-full bg-[var(--color-tm-indigo)]/20 flex items-center justify-center shrink-0">
			<span class="material-symbols-outlined text-[var(--color-tm-indigo)] text-[24px]">smart_toy</span>
		</div>
		<div class="flex-1">
			<h2 class="text-headline-md font-bold text-on-surface mb-1">Your AI Matching Agent</h2>
			<p class="text-body-md text-on-surface-variant">This autonomous agent runs inside the TEE enclave to scan new trials against your encrypted profile 24/7. Manage what it can access below.</p>
		</div>
		<button class="btn-destructive whitespace-nowrap">Halt Agent</button>
	</div>

	<!-- Permission Groups -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
		
		<!-- Group 1: Hospital Access -->
		<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow">
			<div class="p-4 border-b border-[var(--color-tm-border)] bg-surface-container-low flex justify-between items-center">
				<div class="flex items-center gap-2">
					<span class="material-symbols-outlined text-on-surface-variant">local_hospital</span>
					<h3 class="text-label-md font-semibold text-on-surface uppercase tracking-wider">Hospital Connections</h3>
				</div>
			</div>
			<div class="p-6 space-y-6">
				<!-- Toggle 1 -->
				<div class="flex items-start justify-between gap-4">
					<div>
						<h4 class="text-body-md font-medium text-on-surface mb-1">University College Hospital</h4>
						<p class="text-label-sm text-on-surface-variant">Allow agent to pull updated EHR data (requires active hospital node).</p>
					</div>
					<!-- Switch UI -->
					<label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
						<input type="checkbox" value="" class="sr-only peer" checked>
						<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
					</label>
				</div>
				
				<!-- Toggle 2 -->
				<div class="flex items-start justify-between gap-4">
					<div>
						<h4 class="text-body-md font-medium text-on-surface mb-1">Mayo Clinic</h4>
						<p class="text-label-sm text-on-surface-variant">Allow agent to pull updated EHR data (requires active hospital node).</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
						<input type="checkbox" value="" class="sr-only peer">
						<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
					</label>
				</div>
			</div>
		</section>

		<!-- Group 2: Data Types -->
		<section class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl overflow-hidden inner-glow">
			<div class="p-4 border-b border-[var(--color-tm-border)] bg-surface-container-low flex justify-between items-center">
				<div class="flex items-center gap-2">
					<span class="material-symbols-outlined text-on-surface-variant">database</span>
					<h3 class="text-label-md font-semibold text-on-surface uppercase tracking-wider">Data Modalities</h3>
				</div>
			</div>
			<div class="p-6 space-y-6">
				<!-- Toggle 1 -->
				<div class="flex items-start justify-between gap-4">
					<div>
						<h4 class="text-body-md font-medium text-on-surface mb-1">Basic Demographics</h4>
						<p class="text-label-sm text-on-surface-variant">Age, gender, location (used for basic filtering).</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
						<input type="checkbox" value="" class="sr-only peer" checked disabled>
						<div class="w-11 h-6 bg-primary/50 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[22px] after:bg-white after:rounded-full after:h-5 after:w-5"></div>
					</label>
				</div>
				
				<!-- Toggle 2 -->
				<div class="flex items-start justify-between gap-4">
					<div>
						<h4 class="text-body-md font-medium text-on-surface mb-1">Clinical History (EHR)</h4>
						<p class="text-label-sm text-on-surface-variant">Diagnoses, medications, procedures.</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
						<input type="checkbox" value="" class="sr-only peer" checked>
						<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
					</label>
				</div>

				<!-- Toggle 3 -->
				<div class="flex items-start justify-between gap-4">
					<div>
						<h4 class="text-body-md font-medium text-on-surface mb-1">Genomic Data</h4>
						<p class="text-label-sm text-on-surface-variant">VCF files, biomarker panels (highly sensitive).</p>
					</div>
					<label class="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
						<input type="checkbox" value="" class="sr-only peer" checked>
						<div class="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
					</label>
				</div>
			</div>
		</section>

	</div>
</main>
