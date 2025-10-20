import { HeadingCache, TFile, Vault } from 'obsidian';
import { getCacheSafe } from 'obsidian-dev-utils/obsidian/MetadataCache';
import { sectionSortComparators } from '../constants/section-sort-comparators';
import RpgPlayerNotesPlugin from '../main';
import { ComparatorFn } from '../types/rpg-player-notes';

/**
 * The SectionSorter class provides functionality to sort sections of a file based on headings.
 * The sorting process allows for customisation of behaviour such as sorting criteria, specific heading focus, and more.
 */
export class SectionSorter {
	private vault: Vault;

	constructor(private plugin: RpgPlayerNotesPlugin) {
		this.vault = this.plugin.app.vault;
	}

	/**
	 * Sorts sections in a file based on specified criteria.
	 *
	 * @param {TFile} file - The file in which the sections will be sorted.
	 * @param {Object} options - Options to control the sorting behavior.
	 * @param {string} [options.fileContent] - The current content of the file. Pass this to avoid reading from the file directly.
	 * @param {number} [options.lineNumber] - The cursor line number to determine which heading's section to sort.
	 * @param {string} [options.headingText] - The specific heading name to determine the section to sort.
	 * @param {function} [options.compareFn] - A custom comparison function to use while sorting.
	 * @return {Promise<void>} A promise that resolves when the sorting operation is complete.
	 */
	async sortSections(
		file: TFile,
		options: {
			fileContent?: string; // Pass current editor content if available
			lineNumber?: number; // Optional cursor line
			headingText?: string; // Optional heading name
			compareFn?: (a: string, b: string) => number;
		}
	): Promise<void> {
		const cache = await getCacheSafe(this.plugin.app, file);
		await this.vault.process(file, (data) => {
			if (!cache?.headings?.length) {
				return data;
			}

			let currentHeading = null;
			let lines: string[];

			if (options.fileContent) {
				lines = options.fileContent.split('\n');
			} else {
				lines = data.split('\n');
			}

			if (options.lineNumber != null) {
				currentHeading = cache.headings
					.slice()
					.reverse()
					.find((h) => h.position.start.line <= options.lineNumber!);
			} else if (options.headingText) {
				currentHeading = cache.headings.find((h) => h.heading.toLowerCase() === options.headingText!.toLowerCase());
			}

			if (!currentHeading) {
				return data;
			}

			const parentHeading = this.findParentHeading(cache.headings, currentHeading.heading, currentHeading.level);

			if (!parentHeading) {
				// No heading, so we're just sorting the top level sections
				const sorted = this.sortSectionLevel(lines, 1, options.compareFn);
				return sorted.join('\n');
			}

			const parentLevel = parentHeading.level;
			const parentStartLine = parentHeading.position.start.line;
			const parentEndLine = cache.headings.find((h) => h.level <= parentHeading.level && h.position.start.line > parentStartLine)?.position.start.line ?? data.length;

			const sectionLines = lines.slice(parentStartLine + 1, parentEndLine);
			const sorted = this.sortSectionLevel(sectionLines, parentLevel + 1, options.compareFn);
			return [...lines.slice(0, parentStartLine + 1), ...sorted, ...lines.slice(parentEndLine)].join('\n');
		});
	}

	/**
	 * Sorts a list of lines into sections based on headings at a specific level and sorts those sections
	 * using the specified comparison function or a predefined sorting mode.
	 *
	 * @param {string[]} lines - The array of lines to be sorted and grouped into sections.
	 * @param {number} level - The heading level used to group lines into sections.
	 * @param {(a: string, b: string) => number} [compareFn] - Optional custom comparator function used to sort the sections by their headings.
	 * @return {string[]} A new array of lines with sections sorted according to the specified comparator or sorting mode.
	 */
	private sortSectionLevel(lines: string[], level: number, compareFn?: (a: string, b: string) => number): string[] {
		const sections: { heading: string; content: string[] }[] = [];
		let current: { heading: string; content: string[] } | null = null;

		for (const line of lines) {
			if (this.isHeadingAtLevel(line, level)) {
				if (current) {
					sections.push(current);
				}
				current = { heading: line, content: [] };
			} else if (current) {
				current.content.push(line);
			}
		}
		if (current) {
			sections.push(current);
		}
		if (sections.length === 0) {
			return lines;
		}

		if (compareFn != null) {
			sections.sort((a, b) => compareFn(a.heading, b.heading));
		} else if (this.plugin.settings.sortingMode === 'custom' && this.plugin.settings.customSortingRegex) {
			const regex = new RegExp(this.plugin.settings.customSortingRegex, 'gi');
			const customComparator: ComparatorFn = (a, b) => a.heading.replace(regex, '').localeCompare(b.heading.replace(regex, ''), undefined, { sensitivity: 'base' });
			sections.sort(customComparator);
		} else {
			sections.sort(sectionSortComparators[this.plugin.settings.sortingMode] ?? sectionSortComparators.default);
		}
		return sections.flatMap((s) => [s.heading, ...s.content]);
	}

	/**
	 * Finds the parent heading of the given current heading based on its level.
	 *
	 * @param {HeadingCache[]} headings - An array of heading objects, each containing a level and heading name.
	 * @param {string} currentHeading - The name of the current heading for which the parent is being searched.
	 * @param {number} currentLevel - The level of the current heading.
	 * @return {HeadingCache|undefined} - The parent heading object if found; otherwise, undefined.
	 */
	private findParentHeading(headings: HeadingCache[], currentHeading: string, currentLevel: number): HeadingCache | undefined {
		const index = headings.findIndex((h) => h.level === currentLevel && h.heading.toLowerCase() === currentHeading.toLowerCase());

		if (index === -1) {
			return undefined;
		}

		for (let i = index - 1; i >= 0; i--) {
			if (headings[i].level === currentLevel - 1) {
				return headings[i];
			}
		}
	}

	/**
	 * Determines if a given line of text represents a heading at the specified level.
	 *
	 * @param {string} line - The line of text to check.
	 * @param {number} level - The heading level to verify, indicated by the number of '#' characters.
	 * @return {boolean} Returns true if the line represents a heading at the specified level, otherwise false.
	 */
	private isHeadingAtLevel(line: string, level: number): boolean {
		const match = line.match(/^(#+)\s/);
		return match ? match[1].length === level : false;
	}
}
