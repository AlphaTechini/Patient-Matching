<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { identityStore } from '$lib/stores/identity.svelte';

	let { userType, userId } = $props<{
		userType: 'pharma' | 'patient';
		userId: string; // trialId for pharma or patientDid for patient
	}>();

	let unreadCount = $state(0);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	onMount(async () => {
		await fetchUnreadCount();
		startPolling();
	});

	onDestroy(() => {
		stopPolling();
	});

	async function fetchUnreadCount() {
		try {
			let endpoint = '';
			
			if (userType === 'pharma') {
				endpoint = `/api/messages/pharma/unread-count?trialId=${userId}`;
			} else {
				// For patient, get DID from identity store
				const patientDid = identityStore.patientDid;
				if (!patientDid) return;
				endpoint = `/api/messages/patient/unread-count?patientDid=${patientDid}`;
			}

			const response = await fetch(`${API_BASE}${endpoint}`);
			if (!response.ok) return;

			const data = await response.json();
			unreadCount = data.unreadCount || 0;
		} catch (err) {
			console.error('Failed to fetch unread count:', err);
		}
	}

	function startPolling() {
		// Check if we're on messages page
		const isOnMessagesPage = $page.url.pathname.includes('/messages');
		const intervalTime = isOnMessagesPage ? 5000 : 30000; // 5s on messages page, 30s elsewhere

		pollInterval = setInterval(fetchUnreadCount, intervalTime);
	}

	function stopPolling() {
		if (pollInterval) {
			clearInterval(pollInterval);
			pollInterval = null;
		}
	}

	// Reactive polling adjustment based on route
	$effect(() => {
		const isOnMessagesPage = $page.url.pathname.includes('/messages');
		stopPolling();
		startPolling();
	});
</script>

{#if unreadCount > 0}
	<span class="absolute top-1 right-1 min-w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1 shadow-[0_0_12px_rgba(239,68,68,0.8)]">
		{unreadCount > 99 ? '99+' : unreadCount}
	</span>
{/if}
