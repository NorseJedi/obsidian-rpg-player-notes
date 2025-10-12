import { SplitDirection } from 'obsidian';

export type RpnSplitDirection = SplitDirection | 'none';
export type RpnSectionSortComparer = 'caseSensitive' | 'caseInsensitive' | 'natural' | 'ignoreArticles' | 'custom';

export type ComparatorFn = (a: NoteSection, b: NoteSection) => number;

export type NoteType = {
	id: string;
	name: string;
	path: string;
};

export type ReplacementToken = {
	token: string;
	description: string;
	replace: () => string;
};

export type UserDefinedToken = Omit<ReplacementToken, 'replace'> & {
	js: string;
};

export type RpnSettings = {
	openNoteAfterCreation: boolean;
	keepNoteSectionsSorted: boolean;
	sortingMode: RpnSectionSortComparer;
	customSortingRegex: string;
	splitDirection: RpnSplitDirection;
	noteTypes: NoteType[];
	sortNoteTypeListByUsage: boolean;
	noteTypeUsage: Record<string, number>;
	userTokens: UserDefinedToken[];
};

export type TextPromptModalOptions = {
	title?: string;
	description?: string;
	placeholder?: string;
	defaultValue?: string;
};

export type ParsedNoteTarget = {
	notePath: string;
	headings: string[];
};

export type NoteSection = {
	title: string;
	start: number;
	end: number;
	text: string;
};
export type SortingMode = {
	value: string;
	display: string;
};
