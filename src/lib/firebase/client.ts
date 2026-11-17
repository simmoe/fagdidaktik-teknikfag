import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
	browserLocalPersistence,
	browserPopupRedirectResolver,
	getAuth,
	initializeAuth,
	type Auth
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * Offentlig Firebase-webkonfiguration.
 * Projekt: `p5-firebase-eebc1` (delt).
 * Collection: `epx_didaktik_pages`.
 */
let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _storage: FirebaseStorage | undefined;

export function getFirebaseApp(): FirebaseApp {
	if (_app) return _app;
	_app = getApps()[0] ?? initializeApp(firebaseConfig);
	return _app;
}

export function getFirebaseAuth(): Auth {
	if (_auth) return _auth;
	const app = getFirebaseApp();
	try {
		// IndexedDB lukker, når login-popuppen skjuler siden, og så fejler setCurrentUser.
		_auth = initializeAuth(app, {
			persistence: browserLocalPersistence,
			popupRedirectResolver: browserPopupRedirectResolver
		});
	} catch {
		_auth = getAuth(app);
	}
	return _auth;
}

export function getDb(): Firestore {
	if (_db) return _db;
	_db = getFirestore(getFirebaseApp());
	return _db;
}

export function getFirebaseStorage(): FirebaseStorage {
	if (_storage) return _storage;
	_storage = getStorage(getFirebaseApp());
	return _storage;
}

export const COL = {
	pages: 'epx_didaktik_pages'
} as const;

export const OWNER_EMAIL = 'simmoe@gmail.com';
