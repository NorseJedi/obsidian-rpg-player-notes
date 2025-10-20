import { ComparatorFn, NoteSection } from '../types/rpg-player-notes';

/**
 * A collection of comparator functions for sorting `NoteSection` objects
 * based on their headings. Each comparator provides a specific sorting
 * behaviour.
 *
 * - `default`: Sorts headings alphabetically with case sensitivity.
 * - `caseInsensitive`: Sorts headings alphabetically ignoring case sensitivity.
 * - `natural`: Sorts headings alphabetically with natural order (e.g. "2" comes before "10"),
 *   ignoring case sensitivity.
 * - `ignoreArticles`: Sorts headings alphabetically while ignoring leading articles
 *   like "the", "a", or "an".
 *
 * @type {Record<string, ComparatorFn>}
 */
export const sectionSortComparators: Record<string, ComparatorFn> = {
	default: (a: NoteSection, b: NoteSection) => a.heading.localeCompare(b.heading),

	caseInsensitive: (a: NoteSection, b: NoteSection) => a.heading.localeCompare(b.heading, undefined, { sensitivity: 'base' }),

	natural: (a: NoteSection, b: NoteSection) => a.heading.localeCompare(b.heading, undefined, { numeric: true, sensitivity: 'base' }),

	ignoreArticles: (a: NoteSection, b: NoteSection) => {
		const normalize = (s: string) => s.trim().replace(/^(the|a|an)\s+/i, '');
		return normalize(a.heading).localeCompare(normalize(b.heading), undefined, { sensitivity: 'base' });
	}
};
