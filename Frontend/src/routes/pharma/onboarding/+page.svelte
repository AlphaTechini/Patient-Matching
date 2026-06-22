<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_BASE } from '$lib/config';
	import TopBar from '$lib/components/TopBar.svelte';
	import { pharmaStore } from '$lib/stores/pharma.svelte';

	let mode = $state<'login' | 'register'>('login');
	let pharmaName = $state('');
	let pharmaDid = $state('');
	let isLoading = $state(false);
	let error = $state('');

	async function handleSubmit() {
		if (!pharmaName.trim()) {
			error = 'Please enter your organization name';
			return;
		}

		if (mode === 'register' && !pharmaDid.trim()) {
			error = 'Please enter your Terminal 3 DID';
			return;
		}

		if (mode === 'register' && !pharmaDid.startsWith('did:t3n:')) {
			error = 'DID must start with "did:t3n:"';
			return;
		}

		try {
			isLoading = true;
			error = '';

			const endpoint = mode === 'register' 
				? `${API_BASE}/api/pharma/register`
				: `${API_BASE}/api/pharma/login`;

			const body = mode === 'register'
				? { name: pharmaName, did: pharmaDid }
				: { name: pharmaName };

			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `${mode === 'register' ? 'Registration' : 'Login'} failed`);
			}

			const data = await response.json();
			
			// Store pharma info using pharmaStore
			pharmaStore.setPharma(data.pharma);

			// Redirect to trials page
			goto('/pharma/trials');
		} catch (err) {
			error = err instanceof Error ? err.message : `${mode === 'register' ? 'Registration' : 'Login'} failed`;
			console.error('Error:', err);
		} finally {
			isLoading = false;
		}
	}

	function toggleMode() {
		mode = mode === 'login' ? 'register' : 'login';
		error = '';
	}
</script>

<TopBar title="Pharma Portal" showSearch={false} />

<main class="flex-1 flex items-center justify-center p-margin-desktop bg-[var(--color-tm-base)]">
	<div class="w-full max-w-md">
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-2xl p-8 inner-glow">
			<div class="text-center mb-8">
				<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
					<span class="material-symbols-outlined text-primary text-[32px]">science</span>
				</div>
				<h1 class="text-headline-lg font-bold text-on-surface mb-2">
					{mode === 'register' ? 'Register Organization' : 'Pharma Login'}
				</h1>
				<p class="text-body-md text-on-surface-variant">
					{mode === 'register' 
						? 'Create your organization account with Terminal 3' 
						: 'Access your pharma dashboard'}
				</p>
			</div>

			{#if error}
				<div class="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-6 flex items-center gap-2 text-sm">
					<span class="material-symbols-outlined text-[18px]">error</span>
					<p>{error}</p>
				</div>
			{/if}

			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<div class="space-y-4 mb-6">
					<div>
						<label for="pharmaName" class="block text-sm font-medium text-on-surface mb-2">
							Organization Name
						</label>
						<input
							id="pharmaName"
							type="text"
							bind:value={pharmaName}
							placeholder="e.g., GenoPharma Inc."
							class="w-full bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
							required
						/>
					</div>

					{#if mode === 'register'}
						<div>
							<label for="pharmaDid" class="block text-sm font-medium text-on-surface mb-2">
								Terminal 3 DID
								<span class="text-on-surface-variant font-normal ml-1">(from T3N setup)</span>
							</label>
							<input
								id="pharmaDid"
								type="text"
								bind:value={pharmaDid}
								placeholder="did:t3n:..."
								class="w-full bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors font-mono text-sm"
								required
							/>
							<p class="text-xs text-on-surface-variant mt-1">
								Get your DID from the Terminal 3 setup output
							</p>
						</div>
					{/if}
				</div>

				<button 
					type="submit"
					class="btn-primary w-full py-3 mb-4"
					disabled={isLoading}
				>
					{#if isLoading}
						<div class="flex items-center justify-center gap-2">
							<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							{mode === 'register' ? 'Registering...' : 'Logging in...'}
						</div>
					{:else}
						{mode === 'register' ? 'Register Organization' : 'Login'}
					{/if}
				</button>

				<div class="text-center">
					<button
						type="button"
						onclick={toggleMode}
						class="text-sm text-primary hover:text-primary/80 transition-colors"
					>
						{mode === 'register' 
							? 'Already registered? Login instead' 
							: 'New organization? Register here'}
					</button>
				</div>
			</form>
		</div>

		{#if mode === 'register'}
			<div class="mt-6 bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-lg p-4">
				<h3 class="text-sm font-semibold text-on-surface mb-2 flex items-center gap-2">
					<span class="material-symbols-outlined text-[18px] text-primary">info</span>
					How to get your Terminal 3 DID
				</h3>
				<ol class="text-xs text-on-surface-variant space-y-1 list-decimal list-inside">
					<li>Run <code class="bg-[var(--color-tm-base)] px-1 py-0.5 rounded text-primary">pnpm run setup</code> in your server directory</li>
					<li>Copy the <code class="bg-[var(--color-tm-base)] px-1 py-0.5 rounded text-primary">PHARMA_TENANT_DID</code> value from the output</li>
					<li>Paste it in the DID field above</li>
				</ol>
			</div>
		{/if}
	</div>
</main>
