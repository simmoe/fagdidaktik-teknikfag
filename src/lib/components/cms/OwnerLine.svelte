<script lang="ts">
	import { authState } from '$lib/auth.svelte';

	let {
		value,
		class: className = '',
		onsave
	}: {
		value: string;
		class?: string;
		onsave: (next: string) => void | Promise<void>;
	} = $props();

	let node = $state<HTMLSpanElement | undefined>();
	let focused = $state(false);

	$effect(() => {
		if (!node || focused) return;
		if (node.innerText !== value) node.innerText = value;
	});

	async function save() {
		if (!node) return;
		const next = node.innerText.replace(/\u00a0/g, ' ').replace(/\n/g, ' ').trim().slice(0, 200);
		if (!next) {
			node.innerText = value;
			return;
		}
		node.innerText = next;
		if (next === value) return;
		await onsave(next);
	}
</script>

{#if authState.isOwner}
	<span
		bind:this={node}
		class="owner-line {className}"
		contenteditable="true"
		role="textbox"
		tabindex="0"
		onmousedown={(event) => event.stopPropagation()}
		onclick={(event) => event.stopPropagation()}
		onkeydown={(event) => {
			event.stopPropagation();
			if (event.key !== 'Enter') return;
			event.preventDefault();
			event.currentTarget.blur();
		}}
		onfocus={() => (focused = true)}
		onblur={() => {
			focused = false;
			void save();
		}}
	></span>
{:else}
	<span class={className}>{value}</span>
{/if}

<style>
	.owner-line {
		display: inline;
		border-radius: 2px;
		outline: none;
	}

	.owner-line:focus {
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-ink) 16%, transparent);
	}
</style>
