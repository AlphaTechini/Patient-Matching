<script lang="ts">
	import MarketingNav from '$lib/components/MarketingNav.svelte';
	
	let activeTab = $state('signin');
	let selectedRole = $state<'patient' | 'hospital' | 'pharma' | null>(null);
	
	function handleRoleSelect(role: 'patient' | 'hospital' | 'pharma') {
		selectedRole = role;
	}
	
	function getDashboardUrl() {
		switch (selectedRole) {
			case 'patient': return '/matching';
			case 'hospital': return '/hospital/trials';
			case 'pharma': return '/pharma/trials';
			default: return '#';
		}
	}
</script>

<div class="min-h-screen bg-[var(--color-tm-base)] text-on-background noise-bg flex flex-col relative overflow-hidden">
	<MarketingNav />
	
	<!-- Ambient glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

	<main class="flex-1 flex items-center justify-center p-4 z-10 pt-24">
		<div class="w-full max-w-md">
			<!-- Role Selection -->
			{#if !selectedRole}
				<div class="text-center mb-8">
					<h1 class="text-headline-lg font-bold text-primary mb-2 text-glow">Secure Access</h1>
					<p class="text-body-md text-on-surface-variant">Select your identity type to authenticate</p>
				</div>
				
				<div class="space-y-4">
					<button onclick={() => handleRoleSelect('patient')} class="w-full glass-panel p-6 rounded-xl flex items-center space-x-4 hover:border-primary/50 transition-all group text-left">
						<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<span class="material-symbols-outlined text-primary text-[28px]">personal_injury</span>
						</div>
						<div>
							<h3 class="text-headline-md font-bold text-on-surface text-lg">Patient Portal</h3>
							<p class="text-label-sm text-on-surface-variant">Manage data & view trial matches</p>
						</div>
						<span class="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">arrow_forward</span>
					</button>
					
					<button onclick={() => handleRoleSelect('hospital')} class="w-full glass-panel p-6 rounded-xl flex items-center space-x-4 hover:border-primary/50 transition-all group text-left">
						<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<span class="material-symbols-outlined text-primary text-[28px]" style="font-variation-settings: 'FILL' 1;">local_hospital</span>
						</div>
						<div>
							<h3 class="text-headline-md font-bold text-on-surface text-lg">Hospital Node</h3>
							<p class="text-label-sm text-on-surface-variant">Review eligible trial patients</p>
						</div>
						<span class="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">arrow_forward</span>
					</button>
					
					<button onclick={() => handleRoleSelect('pharma')} class="w-full glass-panel p-6 rounded-xl flex items-center space-x-4 hover:border-primary/50 transition-all group text-left">
						<div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<span class="material-symbols-outlined text-primary text-[28px]">science</span>
						</div>
						<div>
							<h3 class="text-headline-md font-bold text-on-surface text-lg">Pharma Sponsor</h3>
							<p class="text-label-sm text-on-surface-variant">Publish trials & view aggregated data</p>
						</div>
						<span class="material-symbols-outlined text-on-surface-variant ml-auto group-hover:text-primary transition-colors">arrow_forward</span>
					</button>
				</div>
			
			<!-- Auth Form -->
			{:else}
				<div class="text-center mb-8 relative">
					<button onclick={() => selectedRole = null} class="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors p-2">
						<span class="material-symbols-outlined">arrow_back</span>
					</button>
					<h1 class="text-headline-lg font-bold text-primary mb-2 text-glow capitalize">{selectedRole} Login</h1>
					<p class="text-body-md text-on-surface-variant">Authenticate via TEE Enclave</p>
				</div>
				
				<div class="glass-panel rounded-xl overflow-hidden">
					<div class="flex border-b border-[var(--color-tm-border)]">
						<button class="flex-1 py-4 text-label-md font-semibold {activeTab === 'signin' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}" onclick={() => activeTab = 'signin'}>Sign In</button>
						<button class="flex-1 py-4 text-label-md font-semibold {activeTab === 'signup' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant'}" onclick={() => activeTab = 'signup'}>Create Identity</button>
					</div>
					
					<div class="p-8">
						{#if activeTab === 'signin'}
							<form class="space-y-4">
								<div>
									<label class="block text-label-md text-on-surface mb-2" for="did">Decentralized ID (DID)</label>
									<input type="text" id="did" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono-data" placeholder="did:t3n:...">
								</div>
								<div>
									<label class="block text-label-md text-on-surface mb-2" for="pin">Hardware Enclave PIN</label>
									<input type="password" id="pin" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono-data tracking-widest">
								</div>
								<a href={getDashboardUrl()} class="btn-primary w-full py-3 mt-4 text-center">Authenticate to Enclave</a>
							</form>
						{:else}
							<div class="text-center py-4">
								<div class="w-16 h-16 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center mx-auto mb-4 inner-glow">
									<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[32px]">fingerprint</span>
								</div>
								<h3 class="text-headline-md font-bold text-on-surface mb-2">New Identity Required</h3>
								<p class="text-body-md text-on-surface-variant mb-6">Your identity will be generated on the device and anchored to the clinical ledger. No personal details required.</p>
								<a href={getDashboardUrl()} class="btn-primary w-full py-3 text-center">Generate Secure DID</a>
							</div>
						{/if}
					</div>
				</div>
				
				<div class="mt-8 flex items-start space-x-3 text-label-sm text-on-surface-variant p-4 bg-[var(--color-tm-success)]/10 rounded-lg border border-[var(--color-tm-success)]/20">
					<span class="material-symbols-outlined text-[var(--color-tm-success)]">verified_user</span>
					<p>This authentication happens entirely within the local Trusted Execution Environment. Your private key never leaves this device.</p>
				</div>
			{/if}
		</div>
	</main>
</div>
