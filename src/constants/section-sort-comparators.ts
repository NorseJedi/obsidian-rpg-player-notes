import { ComparatorFn, NoteSection } from '../types/rpg-player-notes';

export const sectionSortComparators: Record<string, ComparatorFn> = {
	default: (a: NoteSection, b: NoteSection) => a.title.localeCompare(b.title),

	caseInsensitive: (a: NoteSection, b: NoteSection) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),

	natural: (a: NoteSection, b: NoteSection) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }),

	ignoreArticles: (a: NoteSection, b: NoteSection) => {
		const normalize = (s: string) => s.trim().replace(/^(the|a|an)\s+/i, '');
		return normalize(a.title).localeCompare(normalize(b.title), undefined, { sensitivity: 'base' });
	}
};
