import type { JSONContent } from '@tiptap/core';

export type CmsRichText = JSONContent;

export type CmsImage = {
	type: 'image';
	id: string;
	src: string;
	path: string;
	alt: string;
	caption: string;
};

export type CmsRichBlock = {
	type: 'rich';
	id: string;
	title?: string;
	content: CmsRichText;
};

export type CmsRapportChapter = {
	id: string;
	title: string;
	cardIds: string[];
};

export type CmsColumn = {
	id: string;
	label: string;
	content: CmsRichText;
};

export type CmsColumnsBlock = {
	type: 'columns';
	id: string;
	columns: CmsColumn[];
};

export const cmsSystemComponents = [
	'chindogu-kravmatrix',
	'designmanual-mood',
	'designmanual-palette-core',
	'designmanual-palette-players',
	'designmanual-type',
	'designmanual-logo',
	'designmanual-buttons',
	'designmanual-grid'
] as const;

export type CmsSystemComponent = (typeof cmsSystemComponents)[number];

export function isCmsSystemComponent(value: unknown): value is CmsSystemComponent {
	return typeof value === 'string' && (cmsSystemComponents as readonly string[]).includes(value);
}

export type CmsSystemBlock = {
	type: 'system';
	id: string;
	component: CmsSystemComponent;
};

export type CmsBlock = CmsRichBlock | CmsImage | CmsColumnsBlock | CmsSystemBlock;

export type CmsContentPage = {
	version: 1;
	kind: 'content';
	eyebrow: string;
	title: string;
	chapters?: CmsRapportChapter[];
	blocks: CmsBlock[];
};

export type CmsProgressionSummary = {
	id: string;
	label: string;
	title: string;
	body: string;
};

export type CmsProgressionModule = {
	id: string;
	time: CmsRichText;
	tasks: CmsRichText;
	deliverable?: CmsRichText;
	links: CmsRichText;
};

export type CmsProgressionDay = {
	id: string;
	title: CmsRichText;
	modules: CmsProgressionModule[];
};

export type CmsProgressionPage = {
	version: 1;
	kind: 'progression';
	eyebrow: string;
	title: string;
	intro: CmsRichText;
	summaries: CmsProgressionSummary[];
	days: CmsProgressionDay[];
};

export type CmsPage = CmsContentPage | CmsProgressionPage;

export type StoredCmsPage = {
	content: CmsPage;
	updatedAt?: unknown;
};
