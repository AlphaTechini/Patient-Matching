<script lang="ts">
	// Shared Footer Component
</script>

<footer class="bg-surface py-stack-lg border-t border-[var(--color-tm-border)] text-on-surface-variant relative z-10 mt-auto">
	<div class="max-w-[1280px] mx-auto px-margin-mobile md:px-margin-desktop">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
			<div class="col-span-1 md:col-span-2">
				<h3 class="text-headline-md font-bold text-primary mb-4 text-glow">TrialMatch</h3>
				<p class="text-body-md max-w-sm">Secure, privacy-first clinical matching powered by Trusted Execution Environments. Your health data never leaves the enclave.</p>
			</div>
			
			<div>
				<h4 class="text-label-md font-semibold text-on-surface mb-4 uppercase tracking-wider">Network Status</h4>
				<ul class="space-y-3">
					<li class="flex items-center space-x-2">
						<div class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] animate-pulse-slow"></div>
						<span class="text-label-sm">TEE Enclaves: Online</span>
					</li>
					<li class="flex items-center space-x-2">
						<div class="w-2 h-2 rounded-full bg-[var(--color-tm-success)] animate-pulse-slow"></div>
						<span class="text-label-sm">Ledger Status: Synchronized</span>
					</li>
				</ul>
			</div>

			<div>
				<h4 class="text-label-md font-semibold text-on-surface mb-4 uppercase tracking-wider">Legal</h4>
				<ul class="space-y-2">
					<li><a href="#" class="text-label-sm hover:text-primary transition-colors">Privacy Policy</a></li>
					<li><a href="#" class="text-label-sm hover:text-primary transition-colors">Terms of Service</a></li>
					<li><a href="#" class="text-label-sm hover:text-primary transition-colors">Data Processing Addendum</a></li>
				</ul>
			</div>
		</div>
		
		<div class="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center text-label-sm">
			<p>&copy; {new Date().getFullYear()} Cyberpunk Inc. All rights reserved.</p>
			<p class="mt-2 md:mt-0 opacity-70 font-mono-data">System Version 2.4.1-TEE</p>
		</div>
	</div>
</footer>
