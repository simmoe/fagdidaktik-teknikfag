<script lang="ts">
	import { authState } from '$lib/auth.svelte';
	import { clonePage, plain } from '$lib/cms/content';
	import { publishCmsPage, removeCmsImage, uploadCmsImage } from '$lib/cms/pages';
	import type { CmsBlock, CmsContentPage, CmsImage, CmsRichText } from '$lib/cms/types';
	import BlockInserter from './BlockInserter.svelte';
	import CmsImageBlock from './CmsImageBlock.svelte';
	import RapportBody from './RapportBody.svelte';
	import RichTextNode from './RichTextNode.svelte';

	let {
		page,
		pageId,
		onPublished,
		editing = false
	}: {
		page: CmsContentPage;
		pageId?: string;
		onPublished?: (page: CmsContentPage) => void;
		editing?: boolean;
	} = $props();

	const inPlace = $derived(editing && Boolean(pageId && onPublished) && authState.isOwner);

	let busy = $state(false);
	let error = $state('');

	function richFallback(id: string): CmsRichText {
		const block = page.blocks.find((item) => item.id === id);
		return block?.type === 'rich' ? block.content : plain();
	}

	type RenderItem =
		| { kind: 'one'; block: CmsBlock }
		| { kind: 'grid'; id: string; images: CmsImage[] };

	const items = $derived.by(() => {
		if (inPlace) {
			return page.blocks.map((block) => ({ kind: 'one' as const, block }));
		}
		const out: RenderItem[] = [];
		let images: CmsImage[] = [];
		const flush = () => {
			if (images.length === 1) out.push({ kind: 'one', block: images[0] });
			else if (images.length > 1) out.push({ kind: 'grid', id: images[0].id, images });
			images = [];
		};
		for (const block of page.blocks) {
			if (block.type === 'image') images.push(block);
			else {
				flush();
				out.push({ kind: 'one', block });
			}
		}
		flush();
		return out;
	});

	async function commit(next: CmsContentPage) {
		if (!pageId || !onPublished) return;
		busy = true;
		error = '';
		try {
			await publishCmsPage(pageId, next);
			onPublished(next);
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Kunne ikke gemme blokken.';
		} finally {
			busy = false;
		}
	}

	async function addBlock(index: number, type: 'rich' | 'image', file?: File) {
		if (!pageId) return;
		if (type === 'rich') {
			const next = clonePage(page);
			next.blocks.splice(index, 0, {
				type: 'rich',
				id: crypto.randomUUID(),
				content: plain()
			});
			await commit(next);
			return;
		}
		if (!file) return;
		const id = crypto.randomUUID();
		busy = true;
		error = '';
		try {
			const uploaded = await uploadCmsImage(pageId, id, file);
			const next = clonePage(page);
			next.blocks.splice(index, 0, {
				type: 'image',
				id,
				src: uploaded.src,
				path: uploaded.path,
				alt: '',
				caption: ''
			});
			await publishCmsPage(pageId, next);
			onPublished?.(next);
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Billedet kunne ikke tilføjes.';
		} finally {
			busy = false;
		}
	}

	async function replaceImage(block: CmsImage, file: File) {
		if (!pageId) return;
		busy = true;
		error = '';
		try {
			const uploaded = await uploadCmsImage(pageId, crypto.randomUUID(), file);
			const next = clonePage(page);
			const index = next.blocks.findIndex((item) => item.id === block.id);
			if (index < 0) return;
			next.blocks[index] = { ...block, ...uploaded };
			await publishCmsPage(pageId, next);
			if (block.path) await removeCmsImage(block.path);
			onPublished?.(next);
		} catch (e) {
			console.error(e);
			error = e instanceof Error ? e.message : 'Billedet kunne ikke skiftes.';
		} finally {
			busy = false;
		}
	}

	async function updateImage(block: CmsImage, patch: Partial<CmsImage>) {
		const next = clonePage(page);
		const index = next.blocks.findIndex((item) => item.id === block.id);
		if (index < 0 || next.blocks[index].type !== 'image') return;
		next.blocks[index] = { ...next.blocks[index], ...patch };
		await commit(next);
	}

	async function removeImage(block: CmsImage) {
		const next = clonePage(page);
		next.blocks = next.blocks.filter((item) => item.id !== block.id);
		await commit(next);
		if (block.path) await removeCmsImage(block.path);
	}

	function asImage(block: CmsBlock): CmsImage {
		if (block.type !== 'image') throw new Error('Forventede et billede.');
		return block;
	}
</script>

<article class="prose-ddu">
	{#if error}<p class="meta">{error}</p>{/if}
	{#if inPlace && pageId}
		<BlockInserter onadd={(type, file) => addBlock(0, type, file)} />
	{/if}

	{#each items as item, index (item.kind === 'grid' ? item.id : item.block.id)}
		{#if item.kind === 'grid'}
			<div class="figure-grid" style={`--figure-cols:${Math.min(item.images.length, 3)}`}>
				{#each item.images as image (image.id)}
					<figure>
						<img src={image.src} alt={image.alt} />
						{#if image.caption}<figcaption>{image.caption}</figcaption>{/if}
					</figure>
				{/each}
			</div>
		{:else if item.block.type === 'rich' && inPlace && pageId && onPublished}
			<RapportBody
				{pageId}
				{page}
				blockId={item.block.id}
				fallback={richFallback(item.block.id)}
				layout="page"
				{onPublished}
			/>
		{:else if item.block.type === 'rich'}
			<RichTextNode node={item.block.content} />
		{:else if item.block.type === 'image' && inPlace}
			<CmsImageBlock
				block={asImage(item.block)}
				{busy}
				onreplace={(file) => replaceImage(asImage(item.block), file)}
				oncaption={(caption) => updateImage(asImage(item.block), { caption })}
				onalt={(alt) => updateImage(asImage(item.block), { alt })}
				onremove={() => removeImage(asImage(item.block))}
			/>
		{:else if item.block.type === 'image'}
			<figure>
				<img src={item.block.src} alt={item.block.alt} />
				{#if item.block.caption}<figcaption>{item.block.caption}</figcaption>{/if}
			</figure>
		{:else if item.block.type === 'columns'}
			<div class="cms-columns" style={`--cms-columns:${Math.max(1, item.block.columns.length)}`}>
				{#each item.block.columns as column (column.id)}
					<section>
						{#if column.label}<p class="section-label">{column.label}</p>{/if}
						<RichTextNode node={column.content} />
					</section>
				{/each}
			</div>
		{/if}

		{#if inPlace && pageId}
			<BlockInserter
				onadd={(type, file) => addBlock(index + 1, type, file)}
			/>
		{/if}
	{/each}
</article>

<style>
	.cms-columns {
		display: grid;
		grid-template-columns: repeat(var(--cms-columns, 3), minmax(0, 1fr));
		margin-top: 1.75rem;
		border-block: 1px solid var(--color-rule);
	}

	.cms-columns section {
		min-width: 0;
		padding: 1.25rem;
		border-right: 1px solid var(--color-rule);
	}

	.cms-columns section:last-child {
		border-right: 0;
	}

	:global(.cms-columns ul) {
		margin-top: 1rem;
		padding-left: 1rem;
	}

	:global(.cms-columns li) {
		font-size: var(--type-ui-size);
		line-height: 1.5;
	}

	@media (max-width: 680px) {
		.cms-columns {
			grid-template-columns: 1fr;
		}

		.cms-columns section {
			border-right: 0;
			border-bottom: 1px solid var(--color-rule);
		}

		.cms-columns section:last-child {
			border-bottom: 0;
		}
	}
</style>
