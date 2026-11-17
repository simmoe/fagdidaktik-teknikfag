<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { authState } from '$lib/auth.svelte';

	let { children } = $props();

	onMount(() => authState.init());
</script>

<div class="min-h-dvh md:pl-64 print:pl-0">
	<Nav />
	<main class="px-6 py-10 md:px-14 md:py-14 lg:px-20 print:px-0 print:py-0">
		{#key page.url.pathname}
			<div in:fade={{ duration: 220, delay: 40, easing: cubicOut }}>
				{@render children()}
			</div>
		{/key}
	</main>
</div>
