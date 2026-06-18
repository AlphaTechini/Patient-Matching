<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import { page } from '$app/stores';
	
	let { children } = $props();
	
	let activeItem = $derived(() => {
		const path = $page.url.pathname;
		if (path.includes('/trials')) return 'trials';
		if (path.includes('/matches')) return 'matches';
		if (path.includes('/audit')) return 'audit';
		return 'trials';
	});
</script>

<div class="flex min-h-screen bg-[var(--color-tm-base)] text-on-background">
	<SideNav role="pharma" activeItem={activeItem()} />
	
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		{@render children()}
	</div>
</div>
