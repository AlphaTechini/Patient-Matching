<script lang="ts">
	import { goto } from '$app/navigation';
	import { API_BASE } from '$lib/config';
	
	let protocolText = $state('');
	let trialName = $state('');
	let phase = $state('');
	let indication = $state('');
	let submitting = $state(false);
	let error = $state('');
	let showPreview = $state(false);
	let parsedCriteria = $state<any>(null);
	
	// Sample protocol text for demo
	const sampleProtocol = `Phase III Immunotherapy Study for Advanced NSCLC

Inclusion Criteria:
- Histologically confirmed non-small cell lung cancer (ICD-10: C34.9)
- Age 18-75 years
- PD-L1 expression ≥50%
- ECOG performance status 0-1
- Adequate organ function

Exclusion Criteria:
- Active autoimmune disease
- Prior systemic therapy for metastatic disease
- Uncontrolled brain metastases
- Pregnancy or breastfeeding`;

	function useSample() {
		protocolText = sampleProtocol;
		trialName = 'Phase III NSCLC Immunotherapy Study';
		phase = 'III';
		indication = 'Non-small cell lung cancer';
	}
	
	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		if (!protocolText.trim()) {
			error = 'Please enter a trial protocol';
			return;
		}
		
		submitting = true;
		error = '';
		
		try {
			const response = await fetch(`${API_BASE}/api/trials/create`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					protocolText,
					trialName: trialName || undefined,
					phase: phase || undefined,
					indication: indication || undefined,
				}),
			});
			
			const data = await response.json();
			
			if (!response.ok) {
				throw new Error(data.error || 'Failed to create trial');
			}
			
			// Show success and redirect
			parsedCriteria = data.trial;
			showPreview = true;
			
			setTimeout(() => {
				goto('/pharma/trials');
			}, 3000);
			
		} catch (err: any) {
			error = err.message || 'Failed to create trial';
		} finally {
			submitting = false;
		}
	}
</script>

<!-- Form Header Area -->
<div class="px-margin-mobile md:px-margin-desktop py-stack-lg border-b border-[var(--color-tm-border)] bg-surface-container/50 backdrop-blur-sm sticky top-0 z-30">
	<div class="max-w-[920px] mx-auto w-full">
		<a href="/pharma/trials" class="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-stack-md text-label-md group">
			<span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
			Back to My Trials
		</a>
		<h1 class="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface mb-2">Publish a New Trial</h1>
		<div class="flex items-start md:items-center gap-2 text-on-surface-variant text-body-md">
			<span class="material-symbols-outlined text-primary mt-1 md:mt-0">auto_awesome</span>
			<p>Our AI will parse your protocol text and extract structured inclusion/exclusion criteria</p>
		</div>
	</div>
</div>

{#if showPreview && parsedCriteria}
	<!-- Success Preview -->
	<div class="flex-1 px-margin-mobile md:px-margin-desktop py-stack-lg overflow-y-auto">
		<div class="max-w-[920px] mx-auto w-full">
			<div class="bg-[var(--color-tm-success)]/10 border border-[var(--color-tm-success)]/20 rounded-xl p-6 mb-6">
				<div class="flex items-start gap-4">
					<div class="w-12 h-12 rounded-full bg-[var(--color-tm-success)]/20 flex items-center justify-center shrink-0">
						<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[32px]">check_circle</span>
					</div>
					<div class="flex-1">
						<h2 class="text-headline-sm font-bold text-[var(--color-tm-success)] mb-2">Trial Published Successfully!</h2>
						<p class="text-body-md text-on-surface mb-4">
							Your trial has been parsed by AI and published to the TEE enclave. Redirecting to trials list...
						</p>
						<div class="grid grid-cols-2 gap-4 text-label-sm">
							<div>
								<p class="text-on-surface-variant">Trial ID</p>
								<p class="font-mono-data text-on-surface">{parsedCriteria.id}</p>
							</div>
							<div>
								<p class="text-on-surface-variant">Criteria Extracted</p>
								<p class="font-mono-data text-on-surface">
									{parsedCriteria.criteria.inclusion.length} inclusion, 
									{parsedCriteria.criteria.exclusion.length} exclusion
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow">
				<h3 class="text-headline-sm font-bold text-on-surface mb-4">Parsed Criteria</h3>
				
				<div class="space-y-4">
					<div>
						<h4 class="text-label-md font-semibold text-primary mb-2">Inclusion Criteria ({parsedCriteria.criteria.inclusion.length})</h4>
						<ul class="space-y-2">
							{#each parsedCriteria.criteria.inclusion as criterion}
								<li class="flex items-start gap-2 text-body-md text-on-surface">
									<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[18px] mt-0.5">check</span>
									<span>{criterion.description || `${criterion.field}: ${criterion.expected || 'any'}`}</span>
								</li>
							{/each}
						</ul>
					</div>
					
					<div>
						<h4 class="text-label-md font-semibold text-[var(--color-tm-danger)] mb-2">Exclusion Criteria ({parsedCriteria.criteria.exclusion.length})</h4>
						<ul class="space-y-2">
							{#each parsedCriteria.criteria.exclusion as criterion}
								<li class="flex items-start gap-2 text-body-md text-on-surface">
									<span class="material-symbols-outlined text-[var(--color-tm-danger)] text-[18px] mt-0.5">close</span>
									<span>{criterion.description || `${criterion.field}: ${criterion.expected || 'any'}`}</span>
								</li>
							{/each}
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- Form Content -->
	<div class="flex-1 px-margin-mobile md:px-margin-desktop py-stack-lg overflow-y-auto pb-[120px]">
		<form onsubmit={handleSubmit} class="max-w-[920px] mx-auto w-full flex flex-col gap-stack-lg">
			
			<!-- Optional Metadata -->
			<div class="bg-surface-container rounded-lg border border-[var(--color-tm-border)] p-stack-md md:p-gutter shadow-sm inner-glow flex flex-col gap-gutter">
				<h3 class="text-headline-sm font-bold text-on-surface flex items-center gap-2">
					<span class="material-symbols-outlined text-primary">clinical_notes</span>
					Trial Metadata (Optional)
				</h3>
				
				<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
					<div class="flex flex-col gap-2">
						<label for="trial-name" class="text-label-md text-on-surface">Trial Name</label>
						<input 
							type="text" 
							id="trial-name" 
							bind:value={trialName}
							placeholder="Auto-detected from protocol" 
							class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
						/>
					</div>
					
					<div class="flex flex-col gap-2">
						<label for="trial-phase" class="text-label-md text-on-surface">Phase</label>
						<select 
							id="trial-phase" 
							bind:value={phase}
							class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md appearance-none focus:outline-none focus:border-primary transition-colors"
						>
							<option value="">Auto-detect</option>
							<option value="I">Phase I</option>
							<option value="II">Phase II</option>
							<option value="III">Phase III</option>
							<option value="IV">Phase IV</option>
						</select>
					</div>
					
					<div class="flex flex-col gap-2">
						<label for="trial-indication" class="text-label-md text-on-surface">Indication</label>
						<input 
							type="text" 
							id="trial-indication" 
							bind:value={indication}
							placeholder="Auto-detected from protocol" 
							class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
						/>
					</div>
				</div>
			</div>

			<!-- Protocol Text Area -->
			<div class="bg-surface-container rounded-lg border border-[var(--color-tm-border)] p-stack-md md:p-gutter shadow-sm inner-glow flex flex-col gap-gutter">
				<div class="flex items-center justify-between">
					<h3 class="text-headline-sm font-bold text-on-surface flex items-center gap-2">
						<span class="material-symbols-outlined text-primary">description</span>
						Trial Protocol
					</h3>
					<button 
						type="button"
						onclick={useSample}
						class="text-label-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1"
					>
						<span class="material-symbols-outlined text-[16px]">auto_fix_high</span>
						Use Sample
					</button>
				</div>
				
				<div class="relative">
					<textarea 
						bind:value={protocolText}
						rows="16" 
						placeholder="Paste your complete trial protocol here... Include inclusion and exclusion criteria, endpoints, study design, etc."
						class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-4 py-3 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors resize-y font-mono-data leading-relaxed"
					></textarea>
				</div>
				
				<div class="flex items-start gap-2 text-label-sm text-on-surface-variant p-3 bg-primary/10 rounded-lg border border-primary/20">
					<span class="material-symbols-outlined text-primary text-[18px]">info</span>
					<p>
						Our LLM will automatically extract structured inclusion/exclusion criteria from your protocol text. 
						The more detailed your protocol, the better the extraction.
					</p>
				</div>
			</div>
			
			{#if error}
				<div class="bg-[var(--color-tm-danger)]/10 border border-[var(--color-tm-danger)]/20 rounded-lg p-4 flex items-start gap-3">
					<span class="material-symbols-outlined text-[var(--color-tm-danger)]">error</span>
					<p class="text-body-md text-[var(--color-tm-danger)]">{error}</p>
				</div>
			{/if}

			<!-- Submit Section -->
			<div class="fixed bottom-0 right-0 w-full bg-surface border-t border-[var(--color-tm-border)] z-40 p-4">
				<div class="max-w-[920px] mx-auto w-full flex items-center justify-between">
					<div class="flex items-center gap-2 text-label-sm text-on-surface-variant">
						<span class="material-symbols-outlined text-primary text-[18px]">lock</span>
						<span>Criteria stored in TEE enclave</span>
					</div>
					<div class="flex items-center gap-3">
						<a href="/pharma/trials" class="btn-ghost py-2 px-4 text-center">Cancel</a>
						<button 
							type="submit" 
							disabled={submitting || !protocolText.trim()}
							class="btn-primary py-2 px-6 text-center inline-flex items-center gap-2 disabled:opacity-50"
						>
							{#if submitting}
								<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
								Parsing with AI...
							{:else}
								<span class="material-symbols-outlined text-[18px]">publish</span>
								Publish Trial
							{/if}
						</button>
					</div>
				</div>
			</div>
		</form>
	</div>
{/if}
