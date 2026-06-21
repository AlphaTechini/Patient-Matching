<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SideNav from '$lib/components/SideNav.svelte';
	import { page } from '$app/stores';
	import { pharmaStore } from '$lib/stores/pharma.svelte';
	
	let { children } = $props();
	
	let activeItem = $derived(() => {
		const path = $page.url.pathname;
		if (path.includes('/trials')) return 'trials';
		if (path.includes('/matches')) return 'matches';
		if (path.includes('/messages')) return 'messages';
		if (path.includes('/audit')) return 'audit';
		return 'trials';
	});

	onMount(() => {
		// Check if on onboarding page
		if ($page.url.pathname.includes('/pharma/onboarding')) {
			return; // Allow access to onboarding page
		}

		// Redirect to onboarding if not authenticated
		if (!pharmaStore.isAuthenticated) {
			goto('/pharma/onboarding');
		}
	});
</script>

<div class="flex min-h-screen bg-[var(--color-tm-base)] text-on-background">
	<SideNav role="pharma" activeItem={activeItem()} />
	
	<div class="flex-1 md:ml-64 flex flex-col min-h-screen">
		{@render children()}
	</div>
</div>
