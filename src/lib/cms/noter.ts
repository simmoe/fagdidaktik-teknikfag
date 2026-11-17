import { link, paragraph, rich } from '$lib/cms/content';
import type { CmsContentPage } from '$lib/cms/types';

export const NOTER_PAGE_ID = 'noter';

const ARTIKEL =
	'https://www.gymnasieforskning.dk/aktuelt/mod-en-praksisfunderet-didaktik-for-epx-uddannelsen';

export const noterFallback: CmsContentPage = {
	version: 1,
	kind: 'content',
	eyebrow: 'Fagdidaktik',
	title: 'Noter',
	blocks: [
		{
			type: 'rich',
			id: 'qvortrup-piekut',
			content: rich(
				paragraph(
					link('Mod en praksisfunderet didaktik for epx-uddannelsen', ARTIKEL)
				),
				paragraph('Ane Qvortrup og Anke Piekut, Gymnasieforskning, 16. marts 2026.')
			)
		}
	]
};
