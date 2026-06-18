<script lang="ts">
	import { API_BASE } from '$lib/config';

	let query = $state('lung cancer immunotherapy phase III');
	let patientDid = $state('did:t3n:patient-001');
	let loading = $state(false);
	let error = $state('');
	let results = $state<any[]>([]);
	let summary = $state('');
	let explanation = $state('');
	let explainingFor = $state('');

	const patients = [
		{ did: 'did:t3n:patient-001', label: 'Patient 001 (Eligible)' },
		{ did: 'did:t3n:patient-002', label: 'Patient 002 (Peanut allergy exclusion)' },
		{ did: 'did:t3n:patient-003', label: 'Patient 003 (Warfarin exclusion)' },
	];

	async function handleMatch() {
		loading = true;
		error = '';
		results = [];
		summary = '';
		explanation = '';
		explainingFor = '';
		try {
			const res = await fetch(`${API_BASE}/api/match`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query, patientDid }),
			});
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			results = data.results ?? [];
			summary = data.summary ?? '';
		} catch (e: any) {
			error = e.message || 'Request failed';
		} finally {
			loading = false;
		}
	}

	async function handleExplain(trialId: string, eligibility: any) {
		explainingFor = trialId;
		explanation = '';
		try {
			const res = await fetch(`${API_BASE}/api/explain`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ trialId, eligibilityResult: eligibility }),
			});
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			explanation = data.explanation;
		} catch (e: any) {
			explanation = `Error: ${e.message}`;
		}
	}

	async function handleRecommend() {
		loading = true;
		error = '';
		results = [];
		summary = '';
		explanation = '';
		explainingFor = '';
		try {
			const res = await fetch(`${API_BASE}/api/trials?patientDid=${encodeURIComponent(patientDid)}`);
			if (!res.ok) throw new Error(await res.text());
			const data = await res.json();
			// Rankings are IDs; create lightweight result items
			results = (data.trials ?? []).map((id: string) => ({
				trial: { id, name: `Trial ${id}` },
				eligibility: { eligible: true, confidence: 1, matched_criteria: 0, total_criteria: 0, failed_criteria: [] }
			}));
			summary = `Top trial recommendations for ${patientDid}`;
		} catch (e: any) {
			error = e.message || 'Request failed';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-slate-50 text-slate-800">
	<header class="border-b bg-white">
		<div class="mx-auto max-w-5xl px-6 py-6">
			<h1 class="text-2xl font-bold text-slate-900">TrialMatch</h1>
			<p class="text-sm text-slate-500">TEE-governed clinical trial patient matching</p>
		</div>
	</header>

	<main class="mx-auto max-w-5xl px-6 py-8">
		<section class="rounded-xl border bg-white p-6 shadow-sm">
			<div class="grid gap-4 sm:grid-cols-3">
				<div class="sm:col-span-2">
					<label class="block text-sm font-medium text-slate-700" for="query">Search query</label>
					<input
						id="query"
						bind:value={query}
						class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						placeholder="e.g. lung cancer immunotherapy phase III"
					/>
				</div>
				<div>
					<label class="block text-sm font-medium text-slate-700" for="patient">Patient DID</label>
					<select
						id="patient"
						bind:value={patientDid}
						class="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						{#each patients as p}
							<option value={p.did}>{p.label}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="mt-4 flex flex-wrap gap-3">
				<button
					onclick={handleMatch}
					disabled={loading}
					class="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? 'Matching...' : 'Match Trials'}
				</button>
				<button
					onclick={handleRecommend}
					disabled={loading}
					class="inline-flex items-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
				>
					{loading ? 'Loading...' : 'Recommend Trials'}
				</button>
			</div>
			{#if error}
				<p class="mt-3 text-sm text-red-600">{error}</p>
			{/if}
		</section>

		{#if summary}
			<section class="mt-6 rounded-xl border bg-white p-6 shadow-sm">
				<h2 class="text-lg font-semibold text-slate-900">Summary</h2>
				<p class="mt-2 text-sm leading-relaxed text-slate-700">{summary}</p>
			</section>
		{/if}

		{#if results.length > 0}
			<section class="mt-6">
				<h2 class="mb-3 text-lg font-semibold text-slate-900">Results</h2>
				<div class="grid gap-4">
					{#each results as r}
						<div class="rounded-xl border bg-white p-5 shadow-sm">
							<div class="flex items-start justify-between gap-4">
								<div>
									<h3 class="text-base font-semibold text-slate-900">{r.trial.name}</h3>
									<p class="text-sm text-slate-500">ID: {r.trial.id}</p>
								</div>
								{#if r.eligibility.eligible}
									<span class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Eligible</span>
								{:else}
									<span class="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">Not Eligible</span>
								{/if}
							</div>
							<div class="mt-3">
								<div class="text-sm text-slate-700">
									Confidence: <span class="font-medium">{Math.round((r.eligibility.confidence || 0) * 100)}%</span>
									<span class="ml-2 text-slate-400">·</span>
									<span class="ml-2">{r.eligibility.matched_criteria}/{r.eligibility.total_criteria} criteria matched</span>
								</div>
								{#if r.eligibility.failed_criteria?.length > 0}
									<div class="mt-2 text-sm text-red-700">
										Failed: {r.eligibility.failed_criteria.join(', ')}
									</div>
								{/if}
							</div>
							<div class="mt-4">
								<button
									onclick={() => handleExplain(r.trial.id, r.eligibility)}
									class="text-sm font-medium text-blue-600 hover:text-blue-700"
								>
									Explain result
								</button>
								{#if explainingFor === r.trial.id}
									<div class="mt-2 rounded-lg bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
										{#if explanation}
											{explanation}
										{:else}
											Loading explanation...
										{/if}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</main>

	<footer class="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-slate-400">
		TEE-governed matching · Patient PII never leaves the enclave
	</footer>
</div>
