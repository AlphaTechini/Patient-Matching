<script lang="ts">
	import { goto } from '$app/navigation';
	import { pharmaStore } from '$lib/stores/pharma.svelte';
	import { identityStore } from '$lib/stores/identity.svelte';

	let { role = 'patient', activeItem = 'dashboard' } = $props<{
		role?: 'patient' | 'pharma' | 'hospital';
		activeItem?: string;
	}>();

	function handleSignOut() {
		if (role === 'pharma') {
			pharmaStore.clearPharma();
			goto('/pharma/onboarding');
		} else if (role === 'patient') {
			identityStore.clear();
			goto('/');
		}
	}

	// Define navigation items based on role
	const navItems = {
		patient: [
			{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
			{ id: 'wallet', label: 'Secure Wallet', icon: 'account_balance_wallet', href: '/wallet' },
			{ id: 'matches', label: 'Trial Matches', icon: 'biotech', href: '/matches' }
		],
		pharma: [
			{ id: 'trials', label: 'My Trials', icon: 'clinical_notes', href: '/pharma/trials' },
			{ id: 'matches', label: 'Match Results', icon: 'person_search', href: '/pharma/matches' }
		],
		hospital: [
			{ id: 'dashboard', label: 'Dashboard', icon: 'dashboard', href: '/hospital/trials' },
			{ id: 'trials', label: 'Trial Review', icon: 'clinical_notes', href: '/hospital/trials' },
			{ id: 'audit', label: 'Audit Log', icon: 'history_edu', href: '#' },
			{ id: 'settings', label: 'Settings', icon: 'settings', href: '#' }
		]
	};

	const currentNav = navItems[role];

	const brandInfo = {
		patient: { title: 'TrialMatch', subtitle: 'Patient Portal', icon: 'health_and_safety', did: 'did:t3n:p:0x8a...3f21' },
		pharma: { 
			get title() { return pharmaStore.name || 'Pharma Portal'; }, 
			subtitle: 'TEE Secured Instance', 
			icon: 'science', 
			get did() { return pharmaStore.did || 'did:t3n:org:...'; }
		},
		hospital: { title: 'Hospital Portal', subtitle: 'TEE Secured Environment', icon: 'local_hospital', did: 'did:t3n:hosp:0x7b...1a2d', orgName: 'University College Hospital' }
	};

	const currentBrand = brandInfo[role];
</script>

<nav class="bg-surface border-r border-[var(--color-tm-border)] h-screen w-64 fixed left-0 top-0 flex flex-col pt-stack-lg pb-4 z-50 inner-glow hidden md:flex">
	<!-- Header -->
	{#if role === 'hospital'}
		<div class="px-gutter mb-stack-lg flex items-center space-x-3">
			<div class="w-8 h-8 rounded bg-primary-container flex items-center justify-center inner-glow">
				<span class="material-symbols-outlined text-[var(--color-on-primary-container)] text-sm fill">local_hospital</span>
			</div>
			<div>
				<h1 class="text-headline-md font-bold text-primary leading-tight text-glow text-lg">{currentBrand.title}</h1>
				<p class="text-label-sm text-on-surface-variant leading-tight">{currentBrand.subtitle}</p>
			</div>
		</div>
		<div class="px-gutter mb-stack-md">
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Organization</p>
			<p class="text-body-md text-on-surface font-medium truncate">{currentBrand.orgName}</p>
			<div class="flex items-center space-x-2 mt-1 cursor-pointer group" onclick={() => alert('DID Copied!')}>
				<span class="text-mono-data text-outline group-hover:text-primary transition-colors">{currentBrand.did}</span>
				<span class="material-symbols-outlined text-[14px] text-outline group-hover:text-primary transition-colors">content_copy</span>
			</div>
		</div>
	{:else}
		<div class="px-gutter mb-stack-lg flex items-center space-x-3">
			<div class="w-10 h-10 rounded-full bg-[var(--color-tm-elevated)] flex items-center justify-center border border-[var(--color-tm-border)]">
				<span class="material-symbols-outlined text-primary">{currentBrand.icon}</span>
			</div>
			<div>
				<h2 class="text-headline-md font-bold text-on-surface text-lg leading-tight">{currentBrand.title}</h2>
				<p class="text-label-sm text-on-surface-variant">{currentBrand.subtitle}</p>
			</div>
		</div>
	{/if}

	{#if role === 'pharma'}
		<!-- CTA for Pharma -->
		<div class="px-4 mb-stack-lg">
			<a href="/pharma/trials/new" class="w-full bg-primary-container text-[#0B0F1A] text-label-md font-semibold py-2 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary transition-colors duration-200">
				<span class="material-symbols-outlined text-sm">add</span>
				New Trial Protocol
			</a>
		</div>
	{/if}

	<!-- Navigation Tabs -->
	<div class="flex-1 overflow-y-auto px-unit">
		{#each currentNav as item}
			{#if item.id === activeItem}
				<a href={item.href} class="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-primary bg-[var(--color-secondary-container)]/10 border-r-2 border-primary opacity-90 transition-all duration-200 mb-1 inner-glow relative overflow-hidden">
					<div class="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
					<span class="material-symbols-outlined relative z-10 fill">{item.icon}</span>
					<span class="text-label-md font-semibold relative z-10">{item.label}</span>
				</a>
			{:else}
				<a href={item.href} class="flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors mb-1">
					<span class="material-symbols-outlined">{item.icon}</span>
					<span class="text-label-md">{item.label}</span>
				</a>
			{/if}
		{/each}
	</div>

	<!-- Footer -->
	<div class="px-4 mt-auto border-t border-[var(--color-tm-border)] pt-4">
		<div class="bg-[var(--color-tm-elevated)] rounded-lg p-3 flex items-center gap-3 border border-[var(--color-tm-border)] mb-4">
			<div class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] pulse-dot"></div>
			<div>
				<p class="text-label-sm text-on-surface-variant uppercase">TEE Node Status</p>
				<p class="text-label-md text-primary">Connected</p>
			</div>
		</div>

		{#if role === 'patient'}
			<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">My Identity</p>
			<div class="flex items-center gap-2 cursor-pointer group mb-4" onclick={() => alert('DID Copied!')}>
				<span class="text-mono-data text-outline group-hover:text-primary transition-colors">{currentBrand.did}</span>
				<span class="material-symbols-outlined text-[14px] text-outline group-hover:text-primary transition-colors">content_copy</span>
			</div>
		{/if}

		{#if role === 'patient' || role === 'pharma'}
			<button 
				onclick={handleSignOut}
				class="w-full bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] text-on-surface-variant hover:text-on-surface hover:border-red-500 hover:bg-red-500/10 transition-colors rounded-lg py-2 px-3 flex items-center justify-center gap-2 text-label-md"
			>
				<span class="material-symbols-outlined text-[18px]">logout</span>
				Sign Out
			</button>
		{/if}
	</div>
</nav>
