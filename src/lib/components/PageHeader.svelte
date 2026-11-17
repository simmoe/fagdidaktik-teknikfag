<script lang="ts">
	let {
		eyebrow = '',
		title
	}: {
		eyebrow?: string;
		title: string;
	} = $props();
</script>

<header class="max-w-2xl">
	{#if eyebrow}
		<p class="section-label mb-4">{eyebrow}</p>
	{/if}
	<h1 class="text-3xl md:text-4xl font-light tracking-tight text-ink leading-tight">
		{title}
	</h1>
</header>
