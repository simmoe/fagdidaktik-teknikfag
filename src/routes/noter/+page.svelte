<script lang="ts">
	import CmsPage from '$lib/components/cms/CmsPage.svelte';
	import { NOTER_PAGE_ID, noterFallback } from '$lib/cms/noter';
</script>

<CmsPage pageId={NOTER_PAGE_ID} fallback={noterFallback} />
