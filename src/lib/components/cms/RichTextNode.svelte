<script lang="ts">
	import type { JSONContent } from '@tiptap/core';
	import RichTextNode from './RichTextNode.svelte';
	import { isSafeHref } from '$lib/cms/content';

	let { node }: { node: JSONContent } = $props();

	const children = $derived(node.content ?? []);
	const marks = $derived(node.marks ?? []);
	const isBold = $derived(marks.some((mark) => mark.type === 'bold'));
	const isItalic = $derived(marks.some((mark) => mark.type === 'italic'));
	const linkMark = $derived(marks.find((mark) => mark.type === 'link'));
	const href = $derived(isSafeHref(linkMark?.attrs?.href) ? String(linkMark?.attrs?.href) : '');
	const external = $derived(!!href && !href.startsWith('/') && !href.startsWith('#'));
</script>

{#if node.type === 'doc'}
	{#each children as child}
		<RichTextNode node={child} />
	{/each}
{:else if node.type === 'paragraph'}
	<p>
		{#each children as child}<RichTextNode node={child} />{/each}
	</p>
{:else if node.type === 'heading' && node.attrs?.level === 3}
	<h3>
		<span class="heading-level">Overskrift 3</span>
		{#each children as child}<RichTextNode node={child} />{/each}
	</h3>
{:else if node.type === 'heading'}
	<h2>
		<span class="heading-level">Overskrift 2</span>
		{#each children as child}<RichTextNode node={child} />{/each}
	</h2>
{:else if node.type === 'bulletList'}
	<ul>
		{#each children as child}<RichTextNode node={child} />{/each}
	</ul>
{:else if node.type === 'orderedList'}
	<ol>
		{#each children as child}<RichTextNode node={child} />{/each}
	</ol>
{:else if node.type === 'listItem'}
	<li>
		{#each children as child}<RichTextNode node={child} />{/each}
	</li>
{:else if node.type === 'blockquote'}
	<blockquote>
		{#each children as child}<RichTextNode node={child} />{/each}
	</blockquote>
{:else if node.type === 'hardBreak'}
	<br />
{:else if node.type === 'text'}
	{#if href && isBold && isItalic}
		<a {href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}><strong><em>{node.text ?? ''}</em></strong></a>
	{:else if href && isBold}
		<a {href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}><strong>{node.text ?? ''}</strong></a>
	{:else if href && isItalic}
		<a {href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}><em>{node.text ?? ''}</em></a>
	{:else if href}
		<a {href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{node.text ?? ''}</a>
	{:else if isBold && isItalic}
		<strong><em>{node.text ?? ''}</em></strong>
	{:else if isBold}
		<strong>{node.text ?? ''}</strong>
	{:else if isItalic}
		<em>{node.text ?? ''}</em>
	{:else}
		{node.text ?? ''}
	{/if}
{/if}

<style>
	.heading-level {
		display: block;
		margin-bottom: 0.2rem;
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-ink-faint);
	}
</style>
