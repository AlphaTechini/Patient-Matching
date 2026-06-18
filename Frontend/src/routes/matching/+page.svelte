<script lang="ts">
	import { onMount } from 'svelte';
	
	let progress = $state(0);
	let step = $state(0);
	
	const steps = [
		'Establishing secure enclave connection...',
		'Fetching encrypted clinical profile...',
		'Running zero-knowledge match algorithms...',
		'Recording attestation to ledger...'
	];
	
	onMount(() => {
		// Simulate progress
		const interval = setInterval(() => {
			if (progress < 100) {
				progress += 1;
				if (progress === 25) step = 1;
				if (progress === 50) step = 2;
				if (progress === 80) step = 3;
			} else {
				clearInterval(interval);
				window.location.href = '/matches'; // Redirect when done
			}
		}, 50);
		
		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen bg-[var(--color-tm-base)] text-on-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
	<!-- Hexagon Background -->
	<div class="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
		<svg viewBox="0 0 100 100" class="w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] animate-spin-slow">
			<polygon points="50,5 95,25 95,75 50,95 5,75 5,25" fill="none" stroke="var(--color-tm-cyan)" stroke-width="0.5" />
			<polygon points="50,15 85,35 85,65 50,85 15,65 15,35" fill="none" stroke="var(--color-tm-indigo)" stroke-width="0.5" />
		</svg>
	</div>

	<div class="z-10 text-center max-w-lg w-full">
		<!-- Orbiting Animation -->
		<div class="relative w-48 h-48 mx-auto mb-12">
			<!-- Central Node -->
			<div class="absolute inset-0 m-auto w-16 h-16 rounded-lg bg-[var(--color-tm-surface)] border-2 border-primary shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center justify-center z-20">
				<span class="material-symbols-outlined text-primary text-[32px]">hub</span>
			</div>
			
			<!-- Orbit Rings -->
			<div class="absolute inset-0 border border-primary/20 rounded-full animate-spin-slow"></div>
			<div class="absolute inset-4 border border-[var(--color-tm-indigo)]/30 rounded-full animate-[spin-slow_15s_reverse_infinite]"></div>
			
			<!-- Orbiting Data Packets -->
			<div class="absolute inset-0 animate-spin-slow">
				<div class="w-3 h-3 bg-primary rounded-full absolute -top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#22d3ee]"></div>
			</div>
			<div class="absolute inset-4 animate-[spin-slow_15s_reverse_infinite]">
				<div class="w-2.5 h-2.5 bg-[var(--color-tm-indigo)] rounded-full absolute top-1/2 -right-1 -translate-y-1/2 shadow-[0_0_10px_#818cf8]"></div>
			</div>
		</div>
		
		<h1 class="text-headline-lg font-bold text-on-surface mb-2">Matching in Progress</h1>
		<p class="text-body-md text-primary font-mono-data mb-8 h-6">{steps[step]}</p>
		
		<!-- Progress Bar -->
		<div class="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4 border border-outline-variant/30">
			<div class="h-full bg-primary transition-all duration-100 ease-linear" style="width: {progress}%"></div>
		</div>
		<div class="flex justify-between text-label-sm font-mono-data text-on-surface-variant">
			<span>0%</span>
			<span>{progress}%</span>
			<span>100%</span>
		</div>
		
		<a href="/dashboard" class="inline-block mt-12 text-label-md text-on-surface-variant hover:text-[var(--color-tm-error)] transition-colors underline decoration-dotted">
			Cancel Matching
		</a>
	</div>
</div>
