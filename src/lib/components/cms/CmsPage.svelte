<script lang="ts">
	import { onMount } from 'svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import { authState } from '$lib/auth.svelte';
	import { clonePage } from '$lib/cms/content';
	import { publishCmsPage, subscribeCmsPage } from '$lib/cms/pages';
	import type { CmsContentPage, CmsPage } from '$lib/cms/types';
	import OwnerLine from './OwnerLine.svelte';
	import PageContent from './PageContent.svelte';

	let {
		pageId,
		fallback
	}: {
		pageId: string;
		fallback: CmsContentPage;
	} = $props();

	// svelte-ignore state_referenced_locally
	let content = $state<CmsContentPage>(clonePage(fallback));
	let editing = $state(false);
	let error = $state('');

	function publishContent(next: CmsPage) {
		if (next.kind !== 'content') return;
		content = next;
	}

	async function saveHeader(field: 'eyebrow' | 'title', value: string) {
		const next = clonePage(content);
		next[field] = value;
		try {
			await publishCmsPage(pageId, next);
			content = next;
		} catch (e) {
			console.error(e);
			error = 'Kunne ikke gemme overskriften.';
		}
	}

	onMount(() =>
		subscribeCmsPage(
			pageId,
			fallback,
			(next) => {
				if (next.kind === 'content') content = next;
			},
			(e) => {
				console.error(e);
				error = 'Liveindholdet kunne ikke hentes. Sidens indbyggede version vises.';
			}
		)
	);
</script>

<svelte:head>
	<title>{content.title} — EPX</title>
</svelte:head>

<div class="space-y-10">
	<div class="cms-heading">
		{#if authState.isOwner && editing}
			<header class="max-w-2xl">
				<p class="section-label mb-4">
					<OwnerLine value={content.eyebrow} onsave={(value) => saveHeader('eyebrow', value)} />
				</p>
				<h1 class="text-3xl font-light leading-tight tracking-tight text-ink md:text-4xl">
					<OwnerLine value={content.title} onsave={(value) => saveHeader('title', value)} />
				</h1>
			</header>
		{:else}
			<PageHeader eyebrow={content.eyebrow} title={content.title} />
		{/if}
		{#if authState.isOwner}
			<button type="button" class="edit-button" onclick={() => (editing = !editing)}>
				<span>{editing ? 'Færdig' : 'Redigér side'}</span>
				<svg viewBox="0 0 16 16" aria-hidden="true">
					<path d="M3 8h9M9 4l4 4-4 4" />
				</svg>
			</button>
		{/if}
	</div>

	{#if error && authState.isOwner}<p class="meta">{error}</p>{/if}

	<PageContent page={content} {pageId} {editing} onPublished={publishContent} />
</div>

<style>
	.cms-heading {
		display: flex;
		width: 100%;
		max-width: 68rem;
		min-width: 0;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.edit-button {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.2rem 0;
		border: 0;
		background: transparent;
		color: var(--color-ink-soft);
		font: inherit;
		font-size: 0.75rem;
		cursor: pointer;
	}

	.edit-button svg {
		width: 0.85rem;
		height: 0.85rem;
		overflow: visible;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.35;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	@media (min-width: 768px) {
		.edit-button {
			position: fixed;
			top: 4.75rem;
			right: 2.5rem;
			z-index: 30;
		}
	}
</style>
