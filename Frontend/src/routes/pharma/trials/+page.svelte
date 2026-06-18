<script lang="ts">
	import TopBar from '$lib/components/TopBar.svelte';
	import StatusChip from '$lib/components/StatusChip.svelte';
</script>

<TopBar title="Published Trials" showSearch={false} />

<main class="flex-1 p-margin-desktop max-w-[1280px] w-full mx-auto space-y-stack-lg">
	
	<!-- Header is handled by TopBar and SideNav, but we can add the action here for mobile -->
	<div class="md:hidden flex justify-end mb-4">
		<a href="/pharma/trials/new" class="btn-primary">
			<span class="material-symbols-outlined text-[18px]">add</span>
			Publish New Trial
		</a>
	</div>

	<!-- Summary Strip -->
	<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
		<!-- Card 1 -->
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
			<div>
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Active Trials</p>
				<p class="text-display-xl text-[var(--color-tm-cyan)] text-glow">3</p>
			</div>
			<div class="w-12 h-12 rounded-full bg-[var(--color-tm-cyan)]/10 flex items-center justify-center">
				<span class="material-symbols-outlined text-[var(--color-tm-cyan)] text-[24px]">science</span>
			</div>
		</div>
		
		<!-- Card 2 -->
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
			<div>
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Matches Found</p>
				<p class="text-display-xl text-[var(--color-tm-success)] text-glow">47</p>
			</div>
			<div class="w-12 h-12 rounded-full bg-[var(--color-tm-success)]/10 flex items-center justify-center">
				<span class="material-symbols-outlined text-[var(--color-tm-success)] text-[24px]">group</span>
			</div>
		</div>
		
		<!-- Card 3 -->
		<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl p-stack-md inner-glow flex items-center justify-between">
			<div>
				<p class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Pending Enrollment</p>
				<p class="text-display-xl text-[var(--color-tm-warning)] text-glow">12</p>
			</div>
			<div class="w-12 h-12 rounded-full bg-[var(--color-tm-warning)]/10 flex items-center justify-center">
				<span class="material-symbols-outlined text-[var(--color-tm-warning)] text-[24px]">hourglass_empty</span>
			</div>
		</div>
	</div>

	<!-- Trials Table Section -->
	<div class="bg-[var(--color-tm-surface)] border border-[var(--color-tm-border)] rounded-xl inner-glow overflow-hidden flex flex-col">
		<!-- Table Header/Toolbar -->
		<div class="p-stack-md border-b border-[var(--color-tm-border)] flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-[var(--color-tm-surface)]">
			<div class="flex items-center gap-2">
				<span class="material-symbols-outlined text-primary">list_alt</span>
				<h3 class="text-label-md text-on-surface font-semibold">Trial Portfolios</h3>
			</div>
			<div class="relative">
				<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
				<input type="text" class="bg-[var(--color-tm-base)] border border-[var(--color-tm-border)] rounded-lg text-label-md text-on-surface pl-9 pr-3 py-1.5 focus:border-primary-container focus:ring-1 focus:ring-primary-container/20 w-full sm:w-64 placeholder:text-on-surface-variant" placeholder="Search trials...">
			</div>
		</div>
		
		<!-- Table Content -->
		<div class="overflow-x-auto">
			<table class="w-full text-left border-collapse">
				<thead>
					<tr class="bg-[var(--color-tm-base)] border-b border-[var(--color-tm-border)]">
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Trial Name</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Phase</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Hospital Partner</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Criteria</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Matches</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider">Status</th>
						<th class="py-3 px-4 text-label-sm uppercase text-on-surface-variant font-medium tracking-wider text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="text-body-md">
					<!-- Row 1 -->
					<tr class="border-b border-[var(--color-tm-border)] hover:bg-[var(--color-tm-elevated)] transition-colors group">
						<td class="py-3 px-4 font-medium text-on-surface">NSCLC Stage III Immunotherapy</td>
						<td class="py-3 px-4 text-[var(--color-tm-success)]">Phase III</td>
						<td class="py-3 px-4 text-on-surface-variant">University College Hospital</td>
						<td class="py-3 px-4 text-on-surface-variant">14 criteria</td>
						<td class="py-3 px-4 font-mono-data text-[var(--color-tm-success)] font-bold">22</td>
						<td class="py-3 px-4">
							<StatusChip status="Active" size="sm" />
						</td>
						<td class="py-3 px-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="btn-ghost py-1 px-3 text-sm">View Results</button>
								<button class="text-on-surface-variant hover:text-primary transition-colors p-1">
									<span class="material-symbols-outlined text-[20px]">edit</span>
								</button>
							</div>
						</td>
					</tr>
					<!-- Row 2 -->
					<tr class="border-b border-[var(--color-tm-border)] hover:bg-[var(--color-tm-elevated)] transition-colors group bg-[var(--color-tm-base)]/30">
						<td class="py-3 px-4 font-medium text-on-surface">Early-Onset Alzheimer's Study</td>
						<td class="py-3 px-4 text-[var(--color-tm-cyan)]">Phase II</td>
						<td class="py-3 px-4 text-on-surface-variant">Mayo Clinic</td>
						<td class="py-3 px-4 text-on-surface-variant">9 criteria</td>
						<td class="py-3 px-4 font-mono-data text-[var(--color-tm-success)] font-bold">15</td>
						<td class="py-3 px-4">
							<StatusChip status="Active" size="sm" />
						</td>
						<td class="py-3 px-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="btn-ghost py-1 px-3 text-sm">View Results</button>
								<button class="text-on-surface-variant hover:text-primary transition-colors p-1">
									<span class="material-symbols-outlined text-[20px]">edit</span>
								</button>
							</div>
						</td>
					</tr>
					<!-- Row 3 -->
					<tr class="border-b border-[var(--color-tm-border)] hover:bg-[var(--color-tm-elevated)] transition-colors group">
						<td class="py-3 px-4 font-medium text-on-surface">Cardiovascular Risk Prevention</td>
						<td class="py-3 px-4 text-[var(--color-tm-warning)]">Phase I</td>
						<td class="py-3 px-4 text-on-surface-variant">St. Nicholas Hospital</td>
						<td class="py-3 px-4 text-on-surface-variant">11 criteria</td>
						<td class="py-3 px-4 font-mono-data text-[var(--color-tm-success)] font-bold">10</td>
						<td class="py-3 px-4">
							<StatusChip status="Paused" size="sm" />
						</td>
						<td class="py-3 px-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="btn-ghost py-1 px-3 text-sm">View Results</button>
								<button class="text-on-surface-variant hover:text-primary transition-colors p-1">
									<span class="material-symbols-outlined text-[20px]">edit</span>
								</button>
							</div>
						</td>
					</tr>
					<!-- Row 4 -->
					<tr class="hover:bg-[var(--color-tm-elevated)] transition-colors group bg-[var(--color-tm-base)]/30">
						<td class="py-3 px-4 font-medium text-on-surface">Genomic Sequencing - Rare Diseases</td>
						<td class="py-3 px-4 text-[var(--color-tm-success)]">Phase III</td>
						<td class="py-3 px-4 text-on-surface-variant">Nexus Labs</td>
						<td class="py-3 px-4 text-on-surface-variant">18 criteria</td>
						<td class="py-3 px-4 font-mono-data text-on-surface-variant font-bold">0</td>
						<td class="py-3 px-4">
							<StatusChip status="Completed" size="sm" />
						</td>
						<td class="py-3 px-4 text-right">
							<div class="flex items-center justify-end gap-2">
								<button class="btn-ghost py-1 px-3 text-sm">View Results</button>
								<button class="text-on-surface-variant hover:text-primary transition-colors p-1">
									<span class="material-symbols-outlined text-[20px]">edit</span>
								</button>
							</div>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
		
		<!-- Table Footer / Pagination -->
		<div class="p-4 border-t border-[var(--color-tm-border)] bg-[var(--color-tm-base)] flex justify-between items-center text-sm text-on-surface-variant">
			<div>Showing 1 to 4 of 4 results</div>
			<div class="flex gap-1">
				<button class="btn-ghost py-1 px-3 opacity-50 cursor-not-allowed">Previous</button>
				<button class="px-3 py-1 border border-primary rounded bg-primary-container/10 text-primary transition-colors">1</button>
				<button class="btn-ghost py-1 px-3 opacity-50 cursor-not-allowed">Next</button>
			</div>
		</div>
	</div>
</main>
