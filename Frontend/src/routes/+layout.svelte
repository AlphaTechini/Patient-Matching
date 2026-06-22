<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/TrialMatch Logo.png';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
