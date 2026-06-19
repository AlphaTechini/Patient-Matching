<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
</script>

<div class="bg-[var(--color-tm-base)] min-h-screen font-body-md text-on-surface">
	<MarketingNav />

	<main class="pt-20">
		<!-- Hero Section -->
		<section class="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-grid-pattern">
			<div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[var(--color-tm-cyan)]/10 via-[var(--color-tm-base)] to-[var(--color-tm-base)] opacity-50"></div>
			
			<div class="relative z-10 max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop text-center mt-[-10vh]">
				<div class="inline-flex items-center space-x-2 bg-surface-container border border-[var(--color-tm-border)] rounded-full px-4 py-1.5 mb-8 inner-glow">
					<span class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] animate-pulse-slow"></span>
					<span class="text-label-sm text-on-surface-variant font-mono-data tracking-wide uppercase">TEE Network Live &bull; 14 Nodes</span>
				</div>
				
				<h1 class="text-display-xl md:text-[72px] font-bold text-on-surface mb-6 leading-tight tracking-tight text-glow max-w-4xl mx-auto">
					Zero-Knowledge.<br />
					<span class="text-primary">100% Clinical Match.</span>
				</h1>
				
				<p class="text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
					TrialMatch uses Trusted Execution Environments (TEEs) to cross-reference your genomic and clinical data with active trials—without ever exposing your raw data to anyone. Not even us.
				</p>
				
				<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
					<a href="/login" class="btn-primary w-full sm:w-auto text-body-md py-3 px-8">
						Enter Patient Portal
						<span class="material-symbols-outlined text-[20px]">arrow_forward</span>
					</a>
					<a href="/pharma/onboarding" class="btn-ghost w-full sm:w-auto text-body-md py-3 px-8">
						For Institutions
					</a>
				</div>
			</div>
		</section>

		<!-- Trust Band -->
		<section class="border-y border-[var(--color-tm-border)] bg-surface py-6">
			<div class="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale">
				<div class="text-headline-md font-bold text-on-surface">Mayo Clinic</div>
				<div class="text-headline-md font-bold text-on-surface">UCSF Health</div>
				<div class="text-headline-md font-bold text-on-surface">Dana-Farber</div>
				<div class="text-headline-md font-bold text-on-surface">GenoPharma</div>
			</div>
		</section>

		<!-- Features Grid -->
		<section id="privacy" class="py-24 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto">
			<div class="text-center mb-16">
				<h2 class="text-headline-lg font-bold text-primary mb-4 text-glow">Cryptographically Guaranteed Privacy</h2>
				<p class="text-body-lg text-on-surface-variant max-w-2xl mx-auto">Traditional matching requires handing over your data. TrialMatch reverses the paradigm by bringing the algorithm to your encrypted data.</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="glass-panel p-8 rounded-xl hover:border-primary/50 transition-colors">
					<div class="w-12 h-12 rounded-lg bg-primary-container/10 border border-primary/20 flex items-center justify-center mb-6 inner-glow">
						<span class="material-symbols-outlined text-primary text-[28px]">shield_locked</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-3">Hardware Enclaves</h3>
					<p class="text-body-md text-on-surface-variant">Data is processed inside secure TEEs (like Intel SGX). Even the physical server owner cannot see the data inside the enclave.</p>
				</div>
				
				<div class="glass-panel p-8 rounded-xl hover:border-primary/50 transition-colors">
					<div class="w-12 h-12 rounded-lg bg-primary-container/10 border border-primary/20 flex items-center justify-center mb-6 inner-glow">
						<span class="material-symbols-outlined text-primary text-[28px]">hub</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-3">Decentralized Identity</h3>
					<p class="text-body-md text-on-surface-variant">Your identity is managed via DIDs on our clinical ledger. No usernames, no passwords, just cryptographic proofs.</p>
				</div>
				
				<div class="glass-panel p-8 rounded-xl hover:border-primary/50 transition-colors">
					<div class="w-12 h-12 rounded-lg bg-primary-container/10 border border-primary/20 flex items-center justify-center mb-6 inner-glow">
						<span class="material-symbols-outlined text-primary text-[28px]">policy</span>
					</div>
					<h3 class="text-headline-md font-bold text-on-surface mb-3">Granular Consent</h3>
					<p class="text-body-md text-on-surface-variant">You control exactly which hospital or pharma company can decrypt your contact info, only after a mathematical match is verified.</p>
				</div>
			</div>
		</section>
	</main>

	<Footer />
</div>
