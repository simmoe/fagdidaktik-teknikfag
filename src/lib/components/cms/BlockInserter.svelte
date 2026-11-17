<script lang="ts">
	let {
		onadd
	}: {
		onadd: (type: 'rich' | 'image', file?: File) => void | Promise<void>;
	} = $props();

	let open = $state(false);
	let fileInput = $state<HTMLInputElement | undefined>();

	function addText() {
		open = false;
		void onadd('rich');
	}

	function pickImage() {
		open = false;
		fileInput?.click();
	}

	function onFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) void onadd('image', file);
	}
</script>

<div class="inserter" class:open>
	<button
		type="button"
		class="plus"
		aria-label="Tilføj blok"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<span aria-hidden="true"></span>
	</button>
	{#if open}
		<div class="menu" role="menu">
			<button type="button" role="menuitem" onclick={addText}>Tekst</button>
			<button type="button" role="menuitem" onclick={pickImage}>Billede</button>
		</div>
	{/if}
	<input
		bind:this={fileInput}
		class="sr-only"
		type="file"
		accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
		onchange={onFile}
	/>
</div>

<style>
	.inserter {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		height: 0.9rem;
		margin: 0.15rem 0;
	}

	.inserter::before {
		content: '';
		position: absolute;
		inset: 50% 0 auto;
		height: 1px;
		background: transparent;
		transition: background 160ms ease;
	}

	.inserter:hover::before,
	.inserter.open::before {
		background: color-mix(in srgb, var(--color-ink) 18%, transparent);
	}

	.plus {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 1.15rem;
		height: 1.15rem;
		padding: 0;
		border: 1px solid var(--color-rule);
		border-radius: 999px;
		background: var(--color-bg);
		color: var(--color-ink-faint);
		opacity: 0;
		cursor: pointer;
		transition:
			opacity 160ms ease,
			color 160ms ease,
			border-color 160ms ease;
	}

	.inserter:hover .plus,
	.inserter.open .plus {
		opacity: 1;
		color: var(--color-ink);
		border-color: var(--color-ink);
	}

	.plus span,
	.plus span::after {
		position: absolute;
		width: 0.45rem;
		height: 1px;
		background: currentColor;
	}

	.plus span::after {
		content: '';
		transform: rotate(90deg);
	}

	.menu {
		position: absolute;
		top: 1.35rem;
		z-index: 4;
		display: flex;
		gap: 0.85rem;
		padding: 0.35rem 0.15rem 0.15rem;
		background: var(--color-bg);
	}

	.menu button {
		border: 0;
		background: transparent;
		color: var(--color-ink-soft);
		font: inherit;
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		cursor: pointer;
	}

	.menu button:hover {
		color: var(--color-ink);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
