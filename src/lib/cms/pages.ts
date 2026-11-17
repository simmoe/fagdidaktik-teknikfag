import { doc, onSnapshot, serverTimestamp, setDoc, type Unsubscribe } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { authState } from '$lib/auth.svelte';
import { COL, getDb, getFirebaseStorage } from '$lib/firebase/client';
import { clonePage, sanitizePage } from './content';
import type { CmsPage, StoredCmsPage } from './types';

export const CMS_IMAGE_MAX_BYTES = 12 * 1024 * 1024;
const CMS_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const PAGE_ID = /^[A-Za-z0-9._:-]{1,120}$/;

export function subscribeCmsPage(
	pageId: string,
	fallback: CmsPage,
	onData: (page: CmsPage, stored: boolean) => void,
	onError?: (error: Error) => void
): Unsubscribe {
	if (!PAGE_ID.test(pageId)) throw new Error('Ugyldigt side-id.');
	return onSnapshot(
		doc(getDb(), COL.pages, pageId),
		(snapshot) => {
			if (!snapshot.exists()) {
				onData(clonePage(fallback), false);
				return;
			}
			const data = snapshot.data() as Partial<StoredCmsPage>;
			onData(sanitizePage(data.content, fallback), true);
		},
		(error) => onError?.(error)
	);
}

export async function publishCmsPage(pageId: string, page: CmsPage): Promise<void> {
	if (!authState.isOwner) throw new Error('Kun ejeren kan udgive sider.');
	if (!PAGE_ID.test(pageId)) throw new Error('Ugyldigt side-id.');
	const content = sanitizePage(page, page);
	const bytes = new TextEncoder().encode(JSON.stringify(content)).byteLength;
	if (bytes > 900_000) throw new Error('Siden er for stor til Firestore.');
	await setDoc(doc(getDb(), COL.pages, pageId), {
		content,
		updatedAt: serverTimestamp()
	});
}

function imageExt(file: File): string {
	if (file.type === 'image/png') return 'png';
	if (file.type === 'image/webp') return 'webp';
	if (file.type === 'image/gif') return 'gif';
	if (file.type === 'image/avif') return 'avif';
	return 'jpg';
}

export async function uploadCmsImage(
	pageId: string,
	blockId: string,
	file: File
): Promise<{ src: string; path: string }> {
	if (!authState.isOwner) throw new Error('Kun ejeren kan uploade billeder.');
	if (!PAGE_ID.test(pageId) || !PAGE_ID.test(blockId)) throw new Error('Ugyldig billedsti.');
	if (!CMS_IMAGE_TYPES.has(file.type)) {
		throw new Error('Billedet skal være jpeg, png, webp, gif eller avif.');
	}
	if (file.size > CMS_IMAGE_MAX_BYTES) throw new Error('Billedet er for stort (max 12 MB).');

	const path = `fagdidaktik_teknikfag_cms/${pageId}/${blockId}.${imageExt(file)}`;
	const fileRef = ref(getFirebaseStorage(), path);
	await uploadBytes(fileRef, file, { contentType: file.type });
	return { src: await getDownloadURL(fileRef), path };
}

export async function removeCmsImage(path: string): Promise<void> {
	if (!authState.isOwner || !path.startsWith('fagdidaktik_teknikfag_cms/')) return;
	try {
		await deleteObject(ref(getFirebaseStorage(), path));
	} catch {
		/* filen kan allerede være væk */
	}
}
