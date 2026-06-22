<script lang="ts">
	import { API_BASE } from '$lib/config';
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/TopBar.svelte';
	import { identityStore } from '$lib/stores/identity.svelte';

	interface Conversation {
		_id: string;
		trialId: string;
		trialName: string;
		patientDid: string;
		lastMessage: string;
		lastMessageTime: string;
		lastSenderType: 'pharma' | 'patient';
		unreadCount: number;
	}

	interface Message {
		_id: string;
		senderId: string;
		senderType: 'pharma' | 'patient';
		message: string;
		timestamp: string;
		read: boolean;
	}

	// Get from identity store
	let PATIENT_DID = $state('');

	let conversations: Conversation[] = $state([]);
	let selectedConversation: Conversation | null = $state(null);
	let messages: Message[] = $state([]);
	let newMessage = $state('');
	let isLoading = $state(true);
	let isSending = $state(false);
	let isLoadingMessages = $state(false);
	let pollInterval: ReturnType<typeof setInterval> | null = null;

	// Update PATIENT_DID from identity store
	$effect(() => {
		PATIENT_DID = identityStore.patientDid || '';
	});

	onMount(async () => {
		// Wait a tick for PATIENT_DID to be set
		await new Promise(resolve => setTimeout(resolve, 0));
		
		if (PATIENT_DID) {
			await fetchConversations();
			startPolling();
		}

		return () => {
			if (pollInterval) clearInterval(pollInterval);
		};
	});

	async function fetchConversations() {
		try {
			const response = await fetch(`${API_BASE}/api/messages/patient/conversations?patientDid=${PATIENT_DID}`);
			if (!response.ok) throw new Error('Failed to fetch conversations');

			const data = await response.json();
			conversations = data.conversations || [];
			isLoading = false;
		} catch (err) {
			console.error('Error fetching conversations:', err);
			isLoading = false;
		}
	}

	async function selectConversation(conversation: Conversation) {
		selectedConversation = conversation;
		isLoadingMessages = true;
		await fetchMessages(conversation.trialId, conversation.patientDid);
		await markAsRead(conversation.trialId, conversation.patientDid);
		isLoadingMessages = false;
	}

	async function fetchMessages(trialId: string, patientDid: string) {
		try {
			const response = await fetch(`${API_BASE}/api/messages/conversation?trialId=${trialId}&patientDid=${patientDid}`);
			if (!response.ok) throw new Error('Failed to fetch messages');

			const data = await response.json();
			messages = data.messages || [];
		} catch (err) {
			console.error('Error fetching messages:', err);
		}
	}

	async function markAsRead(trialId: string, patientDid: string) {
		try {
			await fetch(`${API_BASE}/api/messages/mark-read`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ trialId, patientDid, readerType: 'patient' })
			});

			// Update conversation unread count locally
			const conv = conversations.find(c => c.trialId === trialId);
			if (conv) conv.unreadCount = 0;
		} catch (err) {
			console.error('Error marking as read:', err);
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !selectedConversation || isSending) return;

		try {
			isSending = true;

			const response = await fetch(`${API_BASE}/api/messages/send`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					trialId: selectedConversation.trialId,
					trialName: selectedConversation.trialName,
					patientDid: PATIENT_DID,
					senderId: PATIENT_DID,
					senderType: 'patient',
					message: newMessage.trim()
				})
			});

			if (!response.ok) throw new Error('Failed to send message');

			const data = await response.json();
			messages = [...messages, data.message];
			newMessage = '';

			// Scroll to bottom
			setTimeout(() => {
				const container = document.getElementById('messages-container');
				if (container) container.scrollTop = container.scrollHeight;
			}, 100);
		} catch (err) {
			console.error('Error sending message:', err);
		} finally {
			isSending = false;
		}
	}

	function startPolling() {
		pollInterval = setInterval(async () => {
			await fetchConversations();
			if (selectedConversation) {
				await fetchMessages(selectedConversation.trialId, selectedConversation.patientDid);
			}
		}, 5000); // Poll every 5 seconds
	}

	function formatTime(timestamp: string): string {
		const date = new Date(timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		
		return date.toLocaleDateString();
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}
</script>

<TopBar title="Messages" showSearch={false} userType="patient" userId={PATIENT_DID} />

<main class="flex-1 flex h-[calc(100vh-64px)] bg-[var(--color-tm-base)]">
	<!-- Conversations List -->
	<div class="w-80 border-r border-[var(--color-tm-border)] bg-[var(--color-tm-surface)] flex flex-col">
		<div class="p-4 border-b border-[var(--color-tm-border)]">
			<h2 class="text-headline-sm font-bold text-on-surface flex items-center gap-2">
				<span class="material-symbols-outlined text-primary">chat</span>
				Conversations
			</h2>
			<p class="text-label-sm text-on-surface-variant mt-1">
				{conversations.length} trial{conversations.length !== 1 ? 's' : ''}
			</p>
		</div>

		<div class="flex-1 overflow-y-auto">
			{#if isLoading}
				<div class="flex items-center justify-center py-8">
					<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
				</div>
			{:else if conversations.length === 0}
				<div class="flex flex-col items-center justify-center py-12 px-4 text-center">
					<span class="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">chat_bubble_outline</span>
					<p class="text-body-md text-on-surface-variant">No conversations yet</p>
					<p class="text-label-sm text-on-surface-variant mt-2">
						Wait for trial coordinators to reach out
					</p>
				</div>
			{:else}
				{#each conversations as conversation}
					<button
						class="w-full p-4 border-b border-[var(--color-tm-border)] hover:bg-[var(--color-tm-elevated)] transition-colors text-left"
						class:bg-[var(--color-tm-elevated)]={selectedConversation?.trialId === conversation.trialId}
						onclick={() => selectConversation(conversation)}
					>
						<div class="flex items-start justify-between gap-2 mb-1">
							<div class="flex items-center gap-2 flex-1 min-w-0">
								<span class="material-symbols-outlined text-primary text-[20px]">science</span>
								<p class="text-body-md font-medium text-on-surface truncate">
									{conversation.trialName}
								</p>
							</div>
							{#if conversation.unreadCount > 0}
								<span class="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-5 text-center">
									{conversation.unreadCount}
								</span>
							{/if}
						</div>
						<p class="text-label-sm text-on-surface-variant mb-1">
							{conversation.trialId}
						</p>
						<div class="flex items-center justify-between gap-2">
							<p class="text-label-sm text-on-surface-variant truncate flex-1">
								{#if conversation.lastSenderType === 'patient'}
									<span class="text-primary">You:</span>
								{/if}
								{conversation.lastMessage}
							</p>
							<span class="text-label-sm text-on-surface-variant shrink-0">
								{formatTime(conversation.lastMessageTime)}
							</span>
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- Messages Area -->
	<div class="flex-1 flex flex-col">
		{#if !selectedConversation}
			<div class="flex items-center justify-center h-full">
				<div class="text-center">
					<span class="material-symbols-outlined text-[64px] text-on-surface-variant mb-4">chat_bubble</span>
					<p class="text-headline-sm text-on-surface-variant">Select a conversation</p>
					<p class="text-label-sm text-on-surface-variant mt-2">Choose a trial to start messaging</p>
				</div>
			</div>
		{:else}
			<!-- Chat Header -->
			<div class="p-4 border-b border-[var(--color-tm-border)] bg-[var(--color-tm-surface)]">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
						<span class="material-symbols-outlined text-primary">science</span>
					</div>
					<div class="flex-1 min-w-0">
						<p class="text-body-md font-medium text-on-surface truncate">
							{selectedConversation.trialName}
						</p>
						<p class="text-label-sm text-on-surface-variant">
							{selectedConversation.trialId}
						</p>
					</div>
				</div>
			</div>

			<!-- Messages Container -->
			<div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
				{#if isLoadingMessages}
					<div class="flex items-center justify-center h-full">
						<div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
					</div>
				{:else if messages.length === 0}
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<span class="material-symbols-outlined text-[48px] text-on-surface-variant mb-3">forum</span>
							<p class="text-body-md text-on-surface-variant">No messages yet</p>
							<p class="text-label-sm text-on-surface-variant mt-2">Start the conversation!</p>
						</div>
					</div>
				{:else}
					{#each messages as message}
						{@const isOwnMessage = message.senderType === 'patient'}
						<div class="flex" class:justify-end={isOwnMessage}>
							<div 
								class="max-w-[70%] rounded-lg p-3"
								class:bg-primary={isOwnMessage}
								class:text-white={isOwnMessage}
								class:bg-[var(--color-tm-surface)]={!isOwnMessage}
								class:border={!isOwnMessage}
								class:border-[var(--color-tm-border)]={!isOwnMessage}
							>
								<p class="text-body-md break-words">{message.message}</p>
								<p 
									class="text-label-sm mt-1 {isOwnMessage ? 'text-white opacity-70' : 'text-on-surface-variant'}"
								>
									{formatTime(message.timestamp)}
								</p>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Message Input -->
			<div class="p-4 border-t border-[var(--color-tm-border)] bg-[var(--color-tm-surface)]">
				<div class="flex items-end gap-3">
					<textarea
						bind:value={newMessage}
						onkeypress={handleKeyPress}
						placeholder="Type a message..."
						rows="1"
						class="flex-1 bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg text-body-md text-on-surface px-4 py-3 focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none placeholder:text-on-surface-variant"
						disabled={isSending}
					></textarea>
					<button
						class="btn-primary px-4 py-3 shrink-0"
						onclick={sendMessage}
						disabled={!newMessage.trim() || isSending}
					>
						{#if isSending}
							<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
						{:else}
							<span class="material-symbols-outlined">send</span>
						{/if}
					</button>
				</div>
				<p class="text-label-sm text-on-surface-variant mt-2">
					Press Enter to send, Shift+Enter for new line
				</p>
			</div>
		{/if}
	</div>
</main>
