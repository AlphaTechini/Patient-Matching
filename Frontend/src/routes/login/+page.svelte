<script lang="ts">
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import { onMount } from 'svelte';
	
	let didInput = $state('');
	let error = $state('');
	
	onMount(() => {
		// Restore identity if exists
		identityStore.restore();
		if (identityStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
	
	function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!didInput.trim()) {
			error = 'Please enter a DID';
			return;
		}
		
		if (!didInput.startsWith('did:t3n:')) {
			error = 'DID must start with "did:t3n:"';
			return;
		}
		
		// Set patient identity
		identityStore.setPatient(didInput);
		
		// Redirect to dashboard
		goto('/dashboard');
	}
	
	function useMockPatient() {
		didInput = 'did:t3n:patient-001';
		error = '';
	}
</script>

<div class="min-h-screen bg-[var(--color-tm-base)] text-on-background noise-bg flex flex-col relative overflow-hidden">
	<!-- Ambient glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

	<main class="flex-1 flex items-center justify-center p-4 z-10">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-headline-lg font-bold text-primary mb-2 text-glow">Patient Login</h1>
				<p class="text-body-md text-on-surface-variant">Enter your DID to access TrialMatch</p>
			</div>
			
			<form onsubmit={handleSubmit} class="glass-panel rounded-xl p-8">
				<div class="mb-6">
					<label class="block text-label-md text-on-surface mb-2" for="did">
						Patient DID
					</label>
					<input 
						type="text" 
						id="did" 
						bind:value={didInput}
						class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-mono-data" 
						placeholder="did:t3n:..."
						autocomplete="off"
					/>
					{#if error}
						<p class="text-sm text-[var(--color-tm-danger)] mt-2">{error}</p>
					{/if}
				</div>
				
				<button type="submit" class="btn-primary w-full py-3">
					Continue
				</button>
				
				<button type="button" onclick={useMockPatient} class="w-full mt-3 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
					Use Mock Patient (did:t3n:patient-001)
				</button>
			</form>
			
			<div class="mt-6 flex items-start space-x-3 text-label-sm text-on-surface-variant p-4 bg-primary/10 rounded-lg border border-primary/20">
				<span class="material-symbols-outlined text-primary">info</span>
				<p>
					For demo purposes, you can enter any DID. In production, this would authenticate via Terminal 3's TEE.
				</p>
			</div>
		</div>
	</main>
</div>
