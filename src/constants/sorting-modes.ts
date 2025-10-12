import { SortingMode } from '../types/rpg-player-notes';

export const SORTING_MODES: SortingMode[] = [
	{ value: 'caseInsensitive', display: 'Case-insensitive (default)' },
	{ value: 'caseSensitive', display: 'Case-sensitive' },
	{ value: 'natural', display: 'Natural sort (10 > 2)' },
	{ value: 'ignoreArticles', display: 'Ignore “The”, “A”, “An”' },
	{ value: 'custom', display: 'Sort by custom RegExp' }
];
