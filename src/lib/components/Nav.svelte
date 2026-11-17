<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { page } from '$app/state';
	import { authState } from '$lib/auth.svelte';

	const items = [
		{ href: '/noter', label: 'Noter' },
		{ href: '/interaktion', label: 'Interaktion' }
	];

	const slideOpts = { duration: 280, easing: cubicOut };
	let mobileOpen = $state(false);

	$effect(() => {
		page.url.pathname;
		mobileOpen = false;
	});
</script>

{#snippet navBody()}
	<div class="flex min-h-full flex-col">
		<ul class="space-y-2.5">
			{#each items as item}
				<li>
					<a
						href={item.href}
						class="block text-[0.8125rem] font-light tracking-tight {page.url.pathname ===
						item.href
							? 'text-ink'
							: 'text-ink-soft'}"
						aria-current={page.url.pathname === item.href ? 'page' : undefined}
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>

		<div class="mt-auto pt-10">
			{#if authState.loading}
				<span class="meta">…</span>
			{:else if authState.isOwner}
				<button type="button" class="tlink text-xs" onclick={() => authState.signOut()}>Log ud</button>
			{:else if authState.user}
				<span class="meta">Ingen skriverettigheder</span>
			{:else}
				<button type="button" class="tlink text-xs" onclick={() => authState.loginGoogle()}
					>Log ind</button
				>
				{#if authState.error}<p class="meta mt-2">{authState.error}</p>{/if}
			{/if}
		</div>
	</div>
{/snippet}

<header
	class="site-nav border-b border-rule print:hidden md:border-b-0 md:border-r md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex md:flex-col"
>
	<div class="flex items-center justify-between gap-4 px-6 py-5 md:px-8 md:pt-10 md:pb-8">
		<a href="/noter" class="block min-w-0">
			<span class="block text-[0.6875rem] font-medium tracking-[0.18em] uppercase text-ink-faint">
				EPX
			</span>
			<span class="mt-1 block text-xl font-light tracking-tight text-ink">Didaktik</span>
		</a>

		<button
			type="button"
			class="md:hidden text-sm text-ink-soft tracking-wide"
			aria-expanded={mobileOpen}
			aria-controls="site-nav-mobile"
			onclick={() => (mobileOpen = !mobileOpen)}
		>
			{#key mobileOpen}
				<span class="inline-block" in:fade={{ duration: 140, easing: cubicOut }}>
					{mobileOpen ? 'Luk' : 'Menu'}
				</span>
			{/key}
		</button>
	</div>

	<nav
		id="site-nav"
		class="hidden px-6 pb-8 md:flex md:flex-1 md:flex-col md:overflow-y-auto md:px-8"
		aria-label="Hovedmenu"
	>
		{@render navBody()}
	</nav>

	{#if mobileOpen}
		<nav
			id="site-nav-mobile"
			class="px-6 pb-8 md:hidden"
			aria-label="Hovedmenu"
			transition:slide={slideOpts}
		>
			{@render navBody()}
		</nav>
	{/if}
</header>
