<script lang="ts">
	import SideNav from '$lib/components/SideNav.svelte';
	import { page } from '$app/stores';
	
	let { children } = $props();
	
	// Determine active item from URL path
	let activeItem = $derived(() => {
		const path = $page.url.pathname;
		if (path.includes('/dashboard')) return 'dashboard';
		if (path.includes('/wallet')) return 'wallet';
		if (path.includes('/matches') || path.includes('/trial/')) return 'matches';
		if (path.includes('/permissions')) return 'permissions';
		if (path.includes('/audit')) return 'audit';
		return 'dashboard';
	});
</script>

<div class="flex min-h-screen bg-[var(--color-tm-base)] text-on-background">
	<SideNav role="patient" activeItem={activeItem()} />
	
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		{@render children()}
	</div>
</div>
