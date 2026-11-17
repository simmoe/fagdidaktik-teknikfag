<script lang="ts">
	import { authState } from '$lib/auth.svelte';
	import { CMS_IMAGE_MAX_BYTES } from '$lib/cms/pages';
	import type { CmsImage } from '$lib/cms/types';
	import OwnerLine from './OwnerLine.svelte';

	let {
		block,
		busy = false,
		onreplace,
		oncaption,
		onalt,
		onremove
	}: {
		block: CmsImage;
		busy?: boolean;
		onreplace: (file: File) => void | Promise<void>;
		oncaption: (caption: string) => void | Promise<void>;
		onalt: (alt: string) => void | Promise<void>;
		onremove: () => void | Promise<void>;
	} = $props();

	let fileInput = $state<HTMLInputElement | undefined>();

	function onFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) void onreplace(file);
	}
</script>

<figure class="cms-image" class:owner={authState.isOwner}>
	{#if block.src}
		<img src={block.src} alt={block.alt} />
	{:else if authState.isOwner}
		<button type="button" class="empty" disabled={busy} onclick={() => fileInput?.click()}>
			Vælg billede
		</button>
	{/if}

	{#if authState.isOwner}
		<div class="tools">
			<button type="button" class="tlink" disabled={busy} onclick={() => fileInput?.click()}>
				{block.src ? 'Skift billede' : 'Vælg'}
			</button>
			<button
				type="button"
				class="tlink"
				disabled={busy}
				onclick={() => {
					if (window.confirm('Slet billedet?')) void onremove();
				}}>Slet</button
			>
		</div>
		<p class="meta caption">
			<OwnerLine
				value={block.caption || 'Billedtekst'}
				onsave={(value) => oncaption(value === 'Billedtekst' ? '' : value)}
			/>
		</p>
		<p class="meta caption">
			Alt:
			<OwnerLine value={block.alt || 'beskrivelse'} onsave={(value) => onalt(value)} />
		</p>
		<input
			bind:this={fileInput}
			class="sr-only"
			type="file"
			accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
			disabled={busy}
			onchange={onFile}
		/>
		<p class="meta hint">Max {CMS_IMAGE_MAX_BYTES / 1024 / 1024} MB</p>
	{:else if block.caption}
		<figcaption>{block.caption}</figcaption>
	{/if}
</figure>

<style>
	.cms-image.owner {
		position: relative;
	}

	.empty {
		display: grid;
		place-items: center;
		width: 100%;
		min-height: 8rem;
		border: 1px dashed var(--color-rule);
		background: transparent;
		color: var(--color-ink-faint);
		font: inherit;
		cursor: pointer;
	}

	.tools {
		display: flex;
		gap: 1rem;
		margin-top: 0.45rem;
	}

	.caption,
	.hint {
		margin: 0.2rem 0 0;
	}

	.hint {
		color: var(--color-ink-faint);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
	}
</style>
