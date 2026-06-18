<script lang="ts">
	// No top bar needed, this is a full-screen form layout
</script>

<!-- Form Header Area -->
<div class="px-margin-mobile md:px-margin-desktop py-stack-lg border-b border-[var(--color-tm-border)] bg-surface-container/50 backdrop-blur-sm sticky top-0 z-30">
	<div class="max-w-[720px] mx-auto w-full">
		<a href="/pharma/trials" class="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors mb-stack-md text-label-md group">
			<span class="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
			Back to My Trials
		</a>
		<h1 class="text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface mb-2">Publish a New Trial</h1>
		<div class="flex items-start md:items-center gap-2 text-on-surface-variant text-body-md">
			<span class="material-symbols-outlined text-primary-container mt-1 md:mt-0 fill">lock</span>
			<p>Criteria are stored in a TEE-secured KV map. Only authorized hospital contracts can read them.</p>
		</div>
	</div>
</div>

<!-- Scrollable Form Content -->
<div class="flex-1 px-margin-mobile md:px-margin-desktop py-stack-lg overflow-y-auto pb-[120px]">
	<div class="max-w-[720px] mx-auto w-full flex flex-col gap-stack-lg">
		
		<!-- Stepper -->
		<div class="flex items-center justify-between border-b border-[var(--color-tm-border)] pb-4 relative">
			<!-- Step 1: Active -->
			<div class="flex-1 flex flex-col gap-2 relative z-10 text-center">
				<span class="text-label-md text-primary-container">Step 1</span>
				<span class="text-label-sm text-on-surface font-semibold tracking-wide uppercase">Trial Details</span>
				<div class="absolute -bottom-[17px] left-0 right-0 h-0.5 bg-primary-container"></div>
			</div>
			<!-- Step 2: Inactive -->
			<div class="flex-1 flex flex-col gap-2 relative z-10 text-center opacity-60">
				<span class="text-label-md text-on-surface-variant">Step 2</span>
				<span class="text-label-sm text-on-surface-variant tracking-wide uppercase">Eligibility Criteria</span>
			</div>
			<!-- Step 3: Inactive -->
			<div class="flex-1 flex flex-col gap-2 relative z-10 text-center opacity-60">
				<span class="text-label-md text-on-surface-variant">Step 3</span>
				<span class="text-label-sm text-on-surface-variant tracking-wide uppercase">Hospital Partners</span>
			</div>
		</div>

		<!-- Step 1 Form Fields -->
		<div class="bg-surface-container rounded-lg border border-[var(--color-tm-border)] p-stack-md md:p-gutter shadow-sm inner-glow flex flex-col gap-gutter">
			
			<!-- Trial Name -->
			<div class="flex flex-col gap-2">
				<label for="trial-name" class="text-label-md text-on-surface">Trial Name</label>
				<div class="relative focus-glow rounded-md">
					<input type="text" id="trial-name" placeholder="e.g., Phase II Study of Novel Kinase Inhibitor" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0 focus:border-transparent transition-colors">
				</div>
			</div>

			<!-- Phase & Indication Row -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
				<!-- Phase -->
				<div class="flex flex-col gap-2">
					<label for="trial-phase" class="text-label-md text-on-surface">Phase</label>
					<div class="relative focus-glow rounded-md">
						<select id="trial-phase" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md appearance-none focus:outline-none focus:ring-0 focus:border-transparent transition-colors">
							<option value="" disabled selected>Select Phase</option>
							<option value="I">Phase I</option>
							<option value="II">Phase II</option>
							<option value="III">Phase III</option>
							<option value="IV">Phase IV</option>
						</select>
						<span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
					</div>
				</div>
				<!-- Indication -->
				<div class="flex flex-col gap-2">
					<label for="trial-indication" class="text-label-md text-on-surface">Indication</label>
					<div class="relative focus-glow rounded-md">
						<input type="text" id="trial-indication" placeholder="e.g., Non-small cell lung cancer" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0 focus:border-transparent transition-colors">
					</div>
				</div>
			</div>

			<!-- Sponsor Name (Read Only) & Expected Enrollment -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
				<!-- Sponsor -->
				<div class="flex flex-col gap-2 opacity-80">
					<label for="sponsor-name" class="text-label-md text-on-surface flex items-center gap-1">
						Sponsor Name
						<span class="material-symbols-outlined text-[16px] text-primary-container fill">lock</span>
					</label>
					<div class="relative rounded-md cursor-not-allowed">
						<input type="text" id="sponsor-name" value="GenoPharma Inc." readonly class="w-full bg-surface-container-highest border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface-variant text-body-md cursor-not-allowed focus:outline-none">
					</div>
				</div>
				<!-- Enrollment -->
				<div class="flex flex-col gap-2">
					<label for="enrollment-count" class="text-label-md text-on-surface">Expected Enrollment Count</label>
					<div class="relative focus-glow rounded-md">
						<input type="number" id="enrollment-count" placeholder="0" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface font-mono-data placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0 focus:border-transparent transition-colors">
					</div>
				</div>
			</div>

			<!-- Start Date -->
			<div class="flex flex-col gap-2 md:w-1/2 md:pr-3">
				<label for="start-date" class="text-label-md text-on-surface">Trial Start Date</label>
				<div class="relative focus-glow rounded-md">
					<input type="date" id="start-date" class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md pl-10 pr-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0 focus:border-transparent transition-colors [color-scheme:dark]">
					<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">calendar_today</span>
				</div>
			</div>

			<!-- Description -->
			<div class="flex flex-col gap-2">
				<label for="trial-description" class="text-label-md text-on-surface">Description</label>
				<div class="relative focus-glow rounded-md">
					<textarea id="trial-description" rows="4" placeholder="Brief overview of the trial protocol and objectives..." class="w-full bg-surface-container-low border border-[var(--color-tm-border)] rounded-md px-3 py-2 text-on-surface text-body-md placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-0 focus:border-transparent transition-colors resize-y"></textarea>
				</div>
			</div>

		</div>
	</div>
</div>

<!-- Sticky Footer -->
<div class="fixed bottom-0 right-0 w-full md:w-[calc(100%-16rem)] bg-surface border-t border-[var(--color-tm-border)] z-40 p-4">
	<div class="max-w-[720px] mx-auto w-full flex items-center justify-between">
		<span class="text-label-md text-on-surface-variant">Step 1 of 3</span>
		<div class="flex items-center gap-3">
			<a href="/pharma/trials" class="btn-ghost py-2 px-4 text-center">Save Draft</a>
			<a href="/pharma/trials" class="btn-primary py-2 px-4 text-center inline-flex items-center gap-2">
				Continue
				<span class="material-symbols-outlined text-[18px]">arrow_forward</span>
			</a>
		</div>
	</div>
</div>
