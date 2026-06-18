<script lang="ts">
	let { did, full = false } = $props<{
		did: string;
		full?: boolean;
	}>();

	let copied = $state(false);

	function copyToClipboard() {
		navigator.clipboard.writeText(did);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	}

	const displayDid = $derived(full ? did : did.length > 20 ? `${did.substring(0, 14)}...${did.substring(did.length - 4)}` : did);
</script>

<div class="flex items-center gap-2 cursor-pointer group" onclick={copyToClipboard}>
	<span class="text-mono-data text-outline group-hover:text-primary transition-colors">{displayDid}</span>
	<span class="material-symbols-outlined text-[14px] {copied ? 'text-[var(--color-tm-success)]' : 'text-outline group-hover:text-primary'} transition-colors">
		{copied ? 'check' : 'content_copy'}
	</span>
</div>
