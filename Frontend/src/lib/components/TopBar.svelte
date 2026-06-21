<script lang="ts">
	let { title = 'Dashboard', showSearch = true, userType, userId } = $props<{
		title?: string;
		showSearch?: boolean;
		userType?: 'pharma' | 'patient';
		userId?: string;
	}>();

	const messagesPath = userType === 'pharma' ? '/pharma/messages' : '/messages';
</script>

<header class="bg-surface/80 backdrop-blur-md border-b border-[var(--color-tm-border)] sticky top-0 right-0 z-40 flex justify-between items-center h-16 px-margin-desktop w-full">
	<div class="flex items-center gap-4">
		<!-- Mobile Menu Button (Visible on small screens) -->
		<button class="md:hidden p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
			<span class="material-symbols-outlined">menu</span>
		</button>
		
		<h1 class="text-headline-md font-bold text-primary tracking-tight text-glow text-lg">{title}</h1>
		
		<div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded bg-[var(--color-tm-success)]/10 border border-[var(--color-tm-success)]/20 ml-4">
			<span class="material-symbols-outlined text-[var(--color-tm-success)] text-sm">lock</span>
			<span class="text-label-sm text-[var(--color-tm-success)] font-medium">Secured by TEE</span>
		</div>
	</div>

	<div class="flex items-center gap-4">
		{#if showSearch}
			<div class="relative hidden lg:block">
				<span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<span class="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
				</span>
				<input 
					type="text" 
					placeholder="Search..." 
					class="bg-surface-container-low border border-[var(--color-tm-border)] text-on-surface text-body-md rounded-lg pl-10 pr-4 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all w-64 placeholder-on-surface-variant/50"
				/>
			</div>
		{/if}

		{#if userType && userId}
			<a 
				href={messagesPath} 
				class="p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high relative"
			>
				<span class="material-symbols-outlined">mail</span>
				<!-- Notification badge will poll for unread count -->
				{#await import('./NotificationBadge.svelte') then { default: NotificationBadge }}
					<NotificationBadge {userType} {userId} />
				{/await}
			</a>
		{/if}

		<button class="p-2 rounded-full text-on-surface-variant hover:text-primary transition-colors hover:bg-surface-container-high">
			<span class="material-symbols-outlined fill">account_circle</span>
		</button>
	</div>
</header>
