<script lang="ts">
	import { goto } from '$app/navigation';
	import { identityStore } from '$lib/stores/identity.svelte';
	import { API_BASE } from '$lib/config';
	import { onMount } from 'svelte';
	
	let email = $state('');
	let loading = $state(false);
	let error = $state('');
	let mode = $state<'login' | 'register'>('login');
	
	onMount(() => {
		// Restore identity if exists
		identityStore.restore();
		if (identityStore.isAuthenticated) {
			goto('/dashboard');
		}
	});
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!email.trim()) {
			error = 'Please enter your email';
			return;
		}
		
		if (!email.includes('@')) {
			error = 'Please enter a valid email';
			return;
		}
		
		loading = true;
		error = '';
		
		try {
			const endpoint = mode === 'login' ? '/patients/login' : '/patients/register';
			const response = await fetch(`${API_BASE}/api${endpoint}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				if (response.status === 404 && mode === 'login') {
					error = 'Patient not found. Please register first.';
					mode = 'register';
				} else if (response.status === 409 && mode === 'register') {
					error = 'Email already registered. Please login.';
					mode = 'login';
				} else {
					error = data.error || 'Request failed';
				}
				return;
			}
			
			// Set patient identity with the DID from backend
			identityStore.setPatient(data.patientDid);
			
			// Redirect to dashboard
			goto('/dashboard');
			
		} catch (err: any) {
			error = err.message || 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-[var(--color-tm-base)] text-on-background noise-bg flex flex-col relative overflow-hidden">
	<!-- Ambient glow -->
	<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

	<main class="flex-1 flex items-center justify-center p-4 z-10">
		<div class="w-full max-w-md">
			<div class="text-center mb-8">
				<h1 class="text-headline-lg font-bold text-primary mb-2 text-glow">
					{mode === 'login' ? 'Patient Login' : 'Create Account'}
				</h1>
				<p class="text-body-md text-on-surface-variant">
					{mode === 'login' ? 'Access your TrialMatch account' : 'Register with your email'}
				</p>
			</div>
			
			<form onsubmit={handleSubmit} class="glass-panel rounded-xl p-8">
				<div class="mb-6">
					<label class="block text-label-md text-on-surface mb-2" for="email">
						Email Address
					</label>
					<input 
						type="email" 
						id="email" 
						bind:value={email}
						disabled={loading}
						class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-lg px-4 py-2.5 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-50" 
						placeholder="patient@example.com"
						autocomplete="email"
					/>
					{#if error}
						<p class="text-sm text-[var(--color-tm-danger)] mt-2">{error}</p>
					{/if}
				</div>
				
				<button type="submit" disabled={loading} class="btn-primary w-full py-3 disabled:opacity-50">
					{loading ? 'Processing...' : mode === 'login' ? 'Login' : 'Create Account'}
				</button>
				
				<button 
					type="button" 
					onclick={() => mode = mode === 'login' ? 'register' : 'login'} 
					disabled={loading}
					class="w-full mt-3 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
				>
					{mode === 'login' ? "Don't have an account? Register" : 'Already registered? Login'}
				</button>
			</form>
			
			<div class="mt-6 flex items-start space-x-3 text-label-sm text-on-surface-variant p-4 bg-primary/10 rounded-lg border border-primary/20">
				<span class="material-symbols-outlined text-primary">info</span>
				<div>
					<p class="font-medium text-on-surface mb-1">Custodial Wallet</p>
					<p>
						{mode === 'register' 
							? 'We\'ll create a secure DID and encrypt your private key. Your email is only used for account recovery.' 
							: 'Your credentials are encrypted and stored securely in the TEE enclave.'}
					</p>
				</div>
			</div>
		</div>
	</main>
</div>
