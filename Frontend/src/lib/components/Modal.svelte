<script lang="ts">
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		isOpen: boolean;
		onClose?: () => void;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		showCloseButton?: boolean;
		children?: Snippet;
	}

	let { 
		isOpen = $bindable(false),
		onClose,
		title,
		size = 'md',
		showCloseButton = true,
		children
	}: Props = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget && showCloseButton) {
			close();
		}
	}

	function close() {
		isOpen = false;
		onClose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && showCloseButton) {
			close();
		}
	}

	onMount(() => {
		if (isOpen) {
			document.addEventListener('keydown', handleKeydown);
			return () => document.removeEventListener('keydown', handleKeydown);
		}
	});

	$effect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
		}
	});
</script>

{#if isOpen}
	<div 
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<div 
			class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-2xl shadow-2xl w-full {sizeClasses[size]} max-h-[90vh] flex flex-col overflow-hidden inner-glow"
		>
			{#if title || showCloseButton}
				<div class="flex items-center justify-between p-6 border-b border-[var(--color-tm-border)]">
					{#if title}
						<h2 class="text-xl font-semibold text-on-surface">{title}</h2>
					{:else}
						<div></div>
					{/if}
					{#if showCloseButton}
						<button 
							onclick={close}
							class="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-[var(--color-tm-elevated)]"
						>
							<span class="material-symbols-outlined text-[24px]">close</span>
						</button>
					{/if}
				</div>
			{/if}

			<div class="flex-1 overflow-y-auto p-6">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
