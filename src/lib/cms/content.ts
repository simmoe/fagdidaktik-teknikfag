import type { JSONContent } from '@tiptap/core';
import { isCmsSystemComponent, type CmsBlock, type CmsPage, type CmsRichText } from './types';

type Mark = { type: 'bold' | 'italic' | 'link'; attrs?: { href: string; target: string; rel: string } };

export type InlineValue =
	| string
	| { text: string; marks: Mark[] };

function textNode(value: InlineValue): JSONContent {
	if (typeof value === 'string') return { type: 'text', text: value };
	return { type: 'text', text: value.text, marks: value.marks };
}

export const bold = (text: string): InlineValue => ({ text, marks: [{ type: 'bold' }] });
export const italic = (text: string): InlineValue => ({ text, marks: [{ type: 'italic' }] });
export const link = (text: string, href: string): InlineValue => ({
	text,
	marks: [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }]
});

export const paragraph = (...content: InlineValue[]): JSONContent => ({
	type: 'paragraph',
	content: content.map(textNode)
});

export const heading = (level: 2 | 3, ...content: InlineValue[]): JSONContent => ({
	type: 'heading',
	attrs: { level },
	content: content.map(textNode)
});

export const bulletList = (...items: InlineValue[][]): JSONContent => ({
	type: 'bulletList',
	content: items.map((item) => ({
		type: 'listItem',
		content: [paragraph(...item)]
	}))
});

export const orderedList = (...items: InlineValue[][]): JSONContent => ({
	type: 'orderedList',
	content: items.map((item) => ({
		type: 'listItem',
		content: [paragraph(...item)]
	}))
});

export const quote = (...content: InlineValue[]): JSONContent => ({
	type: 'blockquote',
	content: [paragraph(...content)]
});

export const quotes = (...paras: InlineValue[][]): JSONContent => ({
	type: 'blockquote',
	content: paras.map((para) => paragraph(...para))
});

export const rich = (...content: JSONContent[]): CmsRichText => ({
	type: 'doc',
	content
});

export const plain = (text = ''): CmsRichText => rich(paragraph(text));

/** CMS-data er ren JSON. JSON-rundturen fjerner også Svelte 5-proxies sikkert. */
export function cloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

export function clonePage<T extends CmsPage>(page: T): T {
	return cloneJson(page);
}

const ALLOWED_NODE_TYPES = new Set([
	'doc',
	'paragraph',
	'heading',
	'text',
	'bulletList',
	'orderedList',
	'listItem',
	'blockquote',
	'hardBreak'
]);
const ALLOWED_MARK_TYPES = new Set(['bold', 'italic', 'link']);

export function isSafeHref(value: unknown): value is string {
	if (typeof value !== 'string' || value.length > 2000) return false;
	if (value.startsWith('/') || value.startsWith('#')) return true;
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:' || url.protocol === 'mailto:';
	} catch {
		return false;
	}
}

export function sanitizeRichText(value: unknown, depth = 0): CmsRichText {
	if (!value || typeof value !== 'object' || depth > 12) return plain();
	const row = value as Record<string, unknown>;
	const type = typeof row.type === 'string' && ALLOWED_NODE_TYPES.has(row.type) ? row.type : 'paragraph';
	const node: JSONContent = { type };

	if (type === 'text') {
		node.text = String(row.text ?? '').slice(0, 50000);
		if (Array.isArray(row.marks)) {
			node.marks = row.marks
				.filter((mark): mark is Record<string, unknown> => !!mark && typeof mark === 'object')
				.flatMap((mark) => {
					const markType = String(mark.type ?? '');
					if (!ALLOWED_MARK_TYPES.has(markType)) return [];
					if (markType !== 'link') return [{ type: markType }];
					const attrs = mark.attrs as Record<string, unknown> | undefined;
					const href = attrs?.href;
					if (!isSafeHref(href)) return [];
					return [{ type: 'link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }];
				});
		}
		return node;
	}

	if (type === 'heading') {
		const level = Number((row.attrs as Record<string, unknown> | undefined)?.level);
		node.attrs = { level: level === 3 ? 3 : 2 };
	}

	if (Array.isArray(row.content)) {
		node.content = row.content.slice(0, 500).map((child) => sanitizeRichText(child, depth + 1));
	}
	if (type === 'doc' && !node.content) node.content = [];
	return node;
}

function validId(value: unknown): string {
	const id = String(value ?? '');
	return /^[A-Za-z0-9._:-]{1,120}$/.test(id) ? id : crypto.randomUUID();
}

export function sanitizePage(value: unknown, fallback: CmsPage): CmsPage {
	if (!value || typeof value !== 'object') return clonePage(fallback);
	const row = value as Record<string, unknown>;
	if (row.version !== 1 || row.kind !== fallback.kind) return clonePage(fallback);
	const eyebrow = String(row.eyebrow ?? fallback.eyebrow).slice(0, 120);
	const title = String(row.title ?? fallback.title).slice(0, 200);

	if (fallback.kind === 'content' && row.kind === 'content') {
		const blocks: CmsBlock[] = [];
		if (Array.isArray(row.blocks)) {
			for (const block of row.blocks.slice(0, 100)) {
				if (!block || typeof block !== 'object') continue;
				const b = block as Record<string, unknown>;
				const id = validId(b.id);
				if (b.type === 'rich') {
					const blockTitle = String(b.title ?? '').slice(0, 200);
					blocks.push({
						type: 'rich',
						id,
						...(blockTitle ? { title: blockTitle } : {}),
						content: sanitizeRichText(b.content)
					});
					continue;
				}
				if (b.type === 'image') {
					const src = String(b.src ?? '');
					if (!isSafeHref(src)) continue;
					blocks.push({
						type: 'image',
						id,
						src,
						path: String(b.path ?? '').slice(0, 300),
						alt: String(b.alt ?? '').slice(0, 500),
						caption: String(b.caption ?? '').slice(0, 500)
					});
					continue;
				}
				if (b.type === 'columns' && Array.isArray(b.columns)) {
					blocks.push({
						type: 'columns',
						id,
						columns: b.columns.slice(0, 4).map((column) => {
							const c = column as Record<string, unknown>;
							return {
								id: validId(c.id),
								label: String(c.label ?? '').slice(0, 200),
								content: sanitizeRichText(c.content)
							};
						})
					});
					continue;
				}
				if (b.type === 'system' && isCmsSystemComponent(b.component)) {
					blocks.push({ type: 'system', id, component: b.component });
				}
			}
		} else {
			blocks.push(...fallback.blocks);
		}
		const chapters = Array.isArray(row.chapters)
			? row.chapters.slice(0, 20).map((chapter) => {
					const item = chapter as Record<string, unknown>;
					return {
						id: validId(item.id),
						title: String(item.title ?? '').slice(0, 200),
						cardIds: Array.isArray(item.cardIds)
							? item.cardIds.slice(0, 40).map((cardId) => validId(cardId))
							: []
					};
				})
			: fallback.kind === 'content'
				? fallback.chapters
				: undefined;
		return {
			version: 1,
			kind: 'content',
			eyebrow,
			title,
			blocks,
			...(chapters?.length ? { chapters } : {})
		};
	}

	if (fallback.kind === 'progression' && row.kind === 'progression') {
		const summaries = Array.isArray(row.summaries)
			? row.summaries.slice(0, 12).map((summary) => {
					const s = summary as Record<string, unknown>;
					return {
						id: validId(s.id),
						label: String(s.label ?? '').slice(0, 120),
						title: String(s.title ?? '').slice(0, 200),
						body: String(s.body ?? '').slice(0, 2000)
					};
				})
			: [];
		const days = Array.isArray(row.days)
			? row.days.slice(0, 100).map((day) => {
					const d = day as Record<string, unknown>;
					return {
						id: validId(d.id),
						title: sanitizeRichText(d.title),
						modules: Array.isArray(d.modules)
							? d.modules.slice(0, 30).map((module) => {
									const m = module as Record<string, unknown>;
									return {
										id: validId(m.id),
										time: sanitizeRichText(m.time),
										tasks: sanitizeRichText(m.tasks),
										deliverable: sanitizeRichText(m.deliverable),
										links: sanitizeRichText(m.links)
									};
								})
							: []
					};
				})
			: fallback.days;
		return {
			version: 1,
			kind: 'progression',
			eyebrow,
			title,
			intro: sanitizeRichText(row.intro),
			summaries,
			days
		};
	}

	return clonePage(fallback);
}
