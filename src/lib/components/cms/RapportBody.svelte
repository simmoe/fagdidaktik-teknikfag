<script lang="ts">
	import { authState } from '$lib/auth.svelte';
	import { cloneJson, clonePage, plain } from '$lib/cms/content';
	import { publishCmsPage } from '$lib/cms/pages';
	import type { JSONContent } from '@tiptap/core';
	import type { CmsContentPage, CmsRichText } from '$lib/cms/types';
	import RichTextEditor from './RichTextEditor.svelte';
	import RichTextNode from './RichTextNode.svelte';

	function richHasText(node: JSONContent): boolean {
		if (node.type === 'text') return Boolean(node.text?.trim());
		return (node.content ?? []).some(richHasText);
	}

	let {
		pageId,
		page,
		blockId,
		fallback,
		layout = 'card',
		onPublished
	}: {
		pageId: string;
		page: CmsContentPage;
		blockId: string;
		fallback: CmsRichText;
		layout?: 'card' | 'page';
		onPublished: (page: CmsContentPage) => void;
	} = $props();

	const stored = $derived(
		page.blocks.find((block) => block.type === 'rich' && block.id === blockId)
	);
	const content = $derived(stored && stored.type === 'rich' ? stored.content : fallback);
	const hasText = $derived(richHasText(content));

	let editing = $state(false);
	let draft = $state<CmsRichText>(plain());
	let busy = $state(false);
	let failed = $state(false);

	function start(event?: MouseEvent) {
		if (!authState.isOwner) return;
		if (event?.target instanceof Element && event.target.closest('a')) return;
		draft = cloneJson(content);
		failed = false;
		editing = true;
	}

	async function save() {
		busy = true;
		failed = false;
		const next = clonePage(page);
		const previous = next.blocks.find((item) => item.id === blockId);
		const title = previous?.type === 'rich' ? previous.title : undefined;
		const block = { type: 'rich' as const, id: blockId, ...(title ? { title } : {}), content: draft };
		const index = next.blocks.findIndex((item) => item.id === blockId);
		if (index >= 0) next.blocks[index] = block;
		else next.blocks.push(block);
		try {
			await publishCmsPage(pageId, next);
			onPublished(next);
			editing = false;
		} catch (error) {
			console.error(error);
			failed = true;
		} finally {
			busy = false;
		}
	}
</script>

{#if editing}
	<div class={layout === 'page' ? 'page-body' : 'card-body'}>
		<RichTextEditor value={draft} onchange={(value) => (draft = value)} />
		<div class="edit-actions">
			<button type="button" class="tlink" disabled={busy} onclick={() => void save()}>Gem</button>
			<button type="button" class="tlink" disabled={busy} onclick={() => (editing = false)}>
				Annuller
			</button>
		</div>
		{#if failed}
			<p class="meta mt-1">Kunne ikke gemme. Prøv igen.</p>
		{/if}
	</div>
{:else if authState.isOwner}
	<div
		class="{layout === 'page' ? 'page-body' : 'card-body'} prose-ddu owner-body"
		role="textbox"
		tabindex="0"
		onclick={start}
		onkeydown={(event) => {
			if (event.key !== 'Enter') return;
			event.preventDefault();
			start();
		}}
	>
		{#if hasText}
			<RichTextNode node={content} />
		{:else}
			<span class="empty">Skriv</span>
		{/if}
	</div>
{:else if hasText}
	<div class="{layout === 'page' ? 'page-body' : 'card-body'} prose-ddu">
		<RichTextNode node={content} />
	</div>
{/if}

<style>
	.card-body {
		max-width: none;
		padding: 0.15rem 2.2rem 1.7rem;
		text-align: left;
	}

	.page-body {
		max-width: none;
	}

	.owner-body {
		display: block;
		width: 100%;
		border-radius: 2px;
		cursor: text;
	}

	.owner-body:hover,
	.owner-body:focus-visible {
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-ink) 16%, transparent);
	}

	.empty {
		color: var(--color-ink-faint);
		font-size: 0.92rem;
		font-weight: 300;
	}

	.edit-actions {
		display: flex;
		gap: 1rem;
		margin-top: 0.7rem;
	}

	@media (max-width: 700px) {
		.card-body {
			padding-right: 1.5rem;
			padding-left: 1.5rem;
		}
	}
</style>
