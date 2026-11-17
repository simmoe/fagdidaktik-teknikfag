import {
	onAuthStateChanged,
	signInWithPopup,
	GoogleAuthProvider,
	signOut as fbSignOut,
	type User
} from 'firebase/auth';
import { getFirebaseAuth, OWNER_EMAIL } from './firebase/client';

class AuthState {
	user = $state<User | null>(null);
	loading = $state(true);
	error = $state('');
	#initialized = false;

	init() {
		if (this.#initialized) return;
		this.#initialized = true;
		onAuthStateChanged(getFirebaseAuth(), (u) => {
			this.user = u;
			this.loading = false;
			if (u) this.error = '';
		});
	}

	get isOwner(): boolean {
		return (
			!!this.user?.email &&
			!!this.user.emailVerified &&
			this.user.email === OWNER_EMAIL
		);
	}

	async loginGoogle() {
		this.error = '';
		const provider = new GoogleAuthProvider();
		provider.setCustomParameters({ prompt: 'select_account' });
		try {
			await signInWithPopup(getFirebaseAuth(), provider);
		} catch (e) {
			console.error(e);
			const code = e && typeof e === 'object' && 'code' in e ? String(e.code) : '';
			if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
			this.error = 'Login lykkedes ikke. Prøv igen.';
		}
	}

	async signOut() {
		await fbSignOut(getFirebaseAuth());
	}

	/** Forfatter-stempel der gemmes på opslag. */
	get author(): { uid: string; name: string } | null {
		const u = this.user;
		if (!u) return null;
		const name = u.displayName?.trim() || u.email?.split('@')[0] || 'Anonym';
		return { uid: u.uid, name };
	}
}

export const authState = new AuthState();
