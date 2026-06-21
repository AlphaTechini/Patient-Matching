<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SideNav from '$lib/components/SideNav.svelte';
	import { page } from '$app/stores';
	import { identityStore } from '$lib/stores/identity.svelte';
	
	let { children } = $props();
	
	// Determine active item from URL path
	let activeItem = $derived(() => {
		const path = $page.url.pathname;
		if (path.includes('/dashboard')) return 'dashboard';
		if (path.includes('/wallet')) return 'wallet';
		if (path.includes('/matches') || path.includes('/trial/')) return 'matches';
		if (path.includes('/messages')) return 'messages';
		if (path.includes('/permissions')) return 'permissions';
		if (path.includes('/audit')) return 'audit';
		return 'dashboard';
	});

	onMount(() => {
		// Restore identity from localStorage if available
		identityStore.restore();

		// Redirect to landing page if not authenticated
		if (!identityStore.isAuthenticated) {
			goto('/');
		}
	});
</script>

<div class="flex min-h-screen bg-[var(--color-tm-base)] text-on-background">
	<SideNav role="patient" activeItem={activeItem()} />
	
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		{@render children()}
	</div>
</div>
