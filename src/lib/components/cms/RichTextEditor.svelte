<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor, type JSONContent } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Link from '@tiptap/extension-link';
	import { sanitizeRichText } from '$lib/cms/content';

	let {
		value,
		onchange,
		compact = false
	}: {
		value: JSONContent;
		onchange: (value: JSONContent) => void;
		compact?: boolean;
	} = $props();

	let host = $state<HTMLDivElement | undefined>();
	let editor = $state<Editor | undefined>();
	let revision = $state(0);

	onMount(() => {
		if (!host) return;
		editor = new Editor({
			element: host,
			extensions: [
				StarterKit.configure({ heading: { levels: [2, 3] } }),
				Link.configure({
					openOnClick: false,
					autolink: true,
					defaultProtocol: 'https:',
					HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' }
				})
			],
			content: sanitizeRichText(value),
			editorProps: {
				attributes: {
					class: compact ? 'cms-rich-prosemirror compact' : 'cms-rich-prosemirror'
				}
			},
			onUpdate: ({ editor: current }) => {
				revision++;
				onchange(sanitizeRichText(current.getJSON()));
			},
			onTransaction: () => revision++
		});
		return () => editor?.destroy();
	});

	function command(run: (current: Editor) => void) {
		if (!editor) return;
		run(editor);
		revision++;
	}

	function editLink() {
		if (!editor) return;
		const previous = String(editor.getAttributes('link').href ?? '');
		const href = window.prompt('Linkadresse', previous);
		if (href === null) return;
		if (!href.trim()) {
			command((current) => current.chain().focus().extendMarkRange('link').unsetLink().run());
			return;
		}
		command((current) =>
			current.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
		);
	}

	function active(name: string, attrs?: Record<string, unknown>): boolean {
		void revision;
		return editor?.isActive(name, attrs) ?? false;
	}
</script>

<div class="rich-editor" class:compact>
	<div class="toolbar" aria-label="Tekstformatering">
		<button
			type="button"
			class:active={active('bold')}
			aria-label="Fed"
			onclick={() => command((current) => current.chain().focus().toggleBold().run())}
		>F</button>
		<button
			type="button"
			class:active={active('italic')}
			aria-label="Kursiv"
			onclick={() => command((current) => current.chain().focus().toggleItalic().run())}
		><em>K</em></button>
		{#if !compact}
			<button
				type="button"
				class:active={active('heading', { level: 2 })}
				onclick={() =>
					command((current) => current.chain().focus().toggleHeading({ level: 2 }).run())}
			>H2</button>
			<button
				type="button"
				class:active={active('heading', { level: 3 })}
				onclick={() =>
					command((current) => current.chain().focus().toggleHeading({ level: 3 }).run())}
			>H3</button>
		{/if}
		<button
			type="button"
			class:active={active('bulletList')}
			aria-label="Punktliste"
			onclick={() => command((current) => current.chain().focus().toggleBulletList().run())}
		>• Liste</button>
		<button
			type="button"
			class:active={active('orderedList')}
			aria-label="Nummereret liste"
			onclick={() => command((current) => current.chain().focus().toggleOrderedList().run())}
		>1. Liste</button>
		{#if !compact}
			<button
				type="button"
				class:active={active('blockquote')}
				aria-label="Citat"
				onclick={() => command((current) => current.chain().focus().toggleBlockquote().run())}
			>Citat</button>
		{/if}
		<button
			type="button"
			class:active={active('link')}
			aria-label="Link"
			onclick={editLink}
		>Link</button>
	</div>
	<div class="editor-host" bind:this={host}></div>
</div>

<style>
	.rich-editor {
		border: 1px solid var(--color-rule);
		background: var(--color-bg);
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem;
		padding: 0.35rem;
		border-bottom: 1px solid var(--color-rule);
	}

	.toolbar button {
		min-height: 1.8rem;
		padding: 0.2rem 0.45rem;
		border: 0;
		background: transparent;
		color: var(--color-ink-soft);
		font: inherit;
		font-size: 0.72rem;
		cursor: pointer;
	}

	.toolbar button:hover,
	.toolbar button.active {
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		color: var(--color-ink);
	}

	.editor-host :global(.cms-rich-prosemirror) {
		min-height: 9rem;
		padding: 0.8rem;
		outline: none;
		font-size: 0.92rem;
		line-height: 1.55;
	}

	.editor-host :global(.cms-rich-prosemirror.compact) {
		min-height: 4.25rem;
	}

	.editor-host :global(p:first-child),
	.editor-host :global(h2:first-child),
	.editor-host :global(h3:first-child) {
		margin-top: 0;
	}

	.editor-host :global(p:last-child),
	.editor-host :global(ul:last-child),
	.editor-host :global(ol:last-child) {
		margin-bottom: 0;
	}

	.editor-host :global(ul),
	.editor-host :global(ol) {
		padding-left: 1.25rem;
	}

	.editor-host :global(a) {
		text-decoration: underline;
	}
</style>
