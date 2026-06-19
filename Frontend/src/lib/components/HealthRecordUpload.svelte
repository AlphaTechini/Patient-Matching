<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { identityStore } from '$lib/stores/identity.svelte';
	
	let uploading = $state(false);
	let uploadComplete = $state(false);
	let error = $state('');
	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	
	async function handleUpload() {
		if (!selectedFile || !identityStore.patientDid) return;
		
		uploading = true;
		error = '';
		
		try {
			const formData = new FormData();
			formData.append('healthRecord', selectedFile);
			formData.append('patientDid', identityStore.patientDid);
			
			const response = await fetch(`${API_BASE}/api/patients/upload-pdf`, {
				method: 'POST',
				body: formData,
			});
			
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Upload failed');
			}
			
			uploadComplete = true;
			selectedFile = null;
		} catch (err: any) {
			error = err.message || 'Upload failed';
		} finally {
			uploading = false;
		}
	}
	
	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			selectedFile = target.files[0];
			uploadComplete = false;
			error = '';
		}
	}
</script>

<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-6 inner-glow">
	<div class="flex items-center gap-3 mb-4">
		<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
			<span class="material-symbols-outlined text-primary">upload_file</span>
		</div>
		<div>
			<h3 class="text-headline-sm font-bold text-on-surface">Health Records</h3>
			<p class="text-label-sm text-on-surface-variant">Upload your medical documents securely</p>
		</div>
	</div>
	
	{#if uploadComplete}
		<div class="bg-[var(--color-tm-success)]/10 border border-[var(--color-tm-success)]/20 rounded-lg p-4 flex items-start gap-3">
			<span class="material-symbols-outlined text-[var(--color-tm-success)]">check_circle</span>
			<div>
				<p class="text-body-md font-medium text-[var(--color-tm-success)] mb-1">Upload Successful</p>
				<p class="text-label-sm text-on-surface-variant">
					Your health records have been encrypted and stored securely in the TEE enclave.
				</p>
			</div>
		</div>
	{:else}
		<div class="border-2 border-dashed border-[var(--color-tm-border)] rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
			<input 
				type="file" 
				bind:this={fileInput}
				onchange={handleFileSelect}
				accept=".pdf,.doc,.docx,.txt"
				class="hidden"
			/>
			
			{#if selectedFile}
				<div class="flex items-center justify-center gap-3 mb-4">
					<span class="material-symbols-outlined text-primary text-[32px]">description</span>
					<div class="text-left">
						<p class="text-body-md font-medium text-on-surface">{selectedFile.name}</p>
						<p class="text-label-sm text-on-surface-variant">{(selectedFile.size / 1024).toFixed(1)} KB</p>
					</div>
				</div>
				
				<div class="flex gap-3 justify-center">
					<button 
						onclick={() => fileInput.click()}
						class="px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
					>
						Change File
					</button>
					<button 
						onclick={handleUpload}
						disabled={uploading}
						class="btn-primary px-6 py-2"
					>
						{uploading ? 'Encrypting...' : 'Upload to TEE'}
					</button>
				</div>
			{:else}
				<span class="material-symbols-outlined text-on-surface-variant text-[48px] mb-3 block">cloud_upload</span>
				<p class="text-body-md text-on-surface mb-2">Drop your health records here</p>
				<p class="text-label-sm text-on-surface-variant mb-4">or click to browse</p>
				<button 
					onclick={() => fileInput.click()}
					class="btn-primary px-6 py-2 inline-block"
				>
					Select File
				</button>
			{/if}
		</div>
	{/if}
	
	{#if error}
		<div class="mt-4 bg-[var(--color-tm-danger)]/10 border border-[var(--color-tm-danger)]/20 rounded-lg p-3 flex items-start gap-2">
			<span class="material-symbols-outlined text-[var(--color-tm-danger)]">error</span>
			<p class="text-label-sm text-[var(--color-tm-danger)]">{error}</p>
		</div>
	{/if}
	
	<div class="mt-4 flex items-start gap-2 text-label-sm text-on-surface-variant">
		<span class="material-symbols-outlined text-primary text-[16px]">lock</span>
		<p>All data is encrypted with AES-256-GCM before storage. Your private key never leaves this device.</p>
	</div>
</div>
