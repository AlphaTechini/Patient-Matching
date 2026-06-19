interface PharmaOrganization {
	name: string;
	did: string;
}

class PharmaStore {
	name = $state<string>('');
	did = $state<string>('');

	constructor() {
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('pharma');
			if (stored) {
				try {
					const pharma: PharmaOrganization = JSON.parse(stored);
					this.name = pharma.name;
					this.did = pharma.did;
				} catch (err) {
					console.error('Failed to parse stored pharma data:', err);
				}
			}
		}
	}

	setPharma(pharma: PharmaOrganization) {
		this.name = pharma.name;
		this.did = pharma.did;
		
		if (typeof window !== 'undefined') {
			localStorage.setItem('pharma', JSON.stringify(pharma));
		}
	}

	clearPharma() {
		this.name = '';
		this.did = '';
		
		if (typeof window !== 'undefined') {
			localStorage.removeItem('pharma');
		}
	}

	get isAuthenticated(): boolean {
		return this.name !== '' && this.did !== '';
	}
}

export const pharmaStore = new PharmaStore();
