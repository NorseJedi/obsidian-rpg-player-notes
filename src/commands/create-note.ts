import { App, Editor, MarkdownFileInfo, MarkdownView, Notice, normalizePath, TFile, Vault, WorkspaceLeaf } from 'obsidian';
import { sectionSortComparators } from '../constants/section-sort-comparators';
import { BUILTIN_TOKENS } from '../constants/tokens';
import { ensureFolderExists, ensureNoteExists, escapeRegExp } from '../lib/helpers';
import RpgPlayerNotesPlugin from '../main';
import { ComparatorFn, NoteSection, NoteType, ParsedNoteTarget, RpnSettings } from '../types/rpg-player-notes';

export const createCompendiumNote = async (plugin: RpgPlayerNotesPlugin, editor: Editor, ctx: MarkdownView | MarkdownFileInfo, title: string, type: NoteType, replaceSelection: boolean) => {
	const vault = plugin.app.vault;
	const currentFile = ctx.file;

	if (!currentFile) {
		return;
	}

	const parsedTarget = parseNoteTarget(plugin, type, title, currentFile);
	const targetNotePath = parsedTarget.notePath;

	let linkTarget: string;
	let targetFile: TFile;
	let insertedHeadings: string[] = [];

	if (parsedTarget.headings.length > 0) {
		// Target is a heading in a note, append under the heading
		targetFile = await ensureNoteExists(vault, targetNotePath);
		linkTarget = normalizePath(`${targetNotePath}#${parsedTarget.headings.join('#')}|${title}`);
		insertedHeadings = await appendUnderHeadings(vault, targetFile, parsedTarget.headings);
		if (plugin.settings.keepNoteSectionsSorted) {
			await sortSections(plugin, targetFile, parsedTarget.headings, parsedTarget.headings.length);
		}
		new Notice(`Added "${title}" under ${parsedTarget.headings.join(' > ')} in ${targetFile.basename}`);
	} else {
		// Target is a new note
		const targetNoteFolder = targetNotePath.substring(0, targetNotePath.lastIndexOf('/'));
		await ensureFolderExists(plugin.app.vault, targetNoteFolder);

		targetFile = vault.getFileByPath(targetNotePath) ?? (await vault.create(targetNotePath, ''));
		linkTarget = plugin.app.metadataCache.fileToLinktext(targetFile, '', true);
		linkTarget = `${linkTarget}|${title}`;
		new Notice(`Created ${type.name} note "${title}" in ${targetNoteFolder}`);
	}

	if (replaceSelection) {
		// Replace selection with a link
		editor.replaceSelection(`[[${linkTarget}]]`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`[[${linkTarget}]]`, cursor);
	}

	if (plugin.settings.openNoteAfterCreation) {
		await openFileAccordingToSettings(plugin, targetNotePath);
		await focusBelowInsertedHeading(plugin.app, targetFile, insertedHeadings.last() ?? '');
	}
};

const appendUnderHeadings = async (vault: Vault, file: TFile, headings: string[]): Promise<string[]> => {
	let data = await vault.read(file);

	let currentLevel = 1;
	let insertPos = data.length;
	const insertedHeadings: string[] = [];

	for (const heading of headings) {
		const headingRegex = new RegExp(`^#{${currentLevel}} ${escapeRegExp(heading)}$`, 'm');
		const match = data.match(headingRegex);

		if (match) {
			// Heading exists, set the insert position right after it
			const headingIndex = match.index!;
			const sectionEnd = findSectionEnd(data, headingIndex, currentLevel);
			insertPos = sectionEnd >= 0 ? sectionEnd : data.length;
			insertedHeadings.push(match[0]);
		} else {
			// Heading not found, insert it at the current position
			const newHeading = `\n\n${'#'.repeat(currentLevel)} ${heading}\n`;
			insertedHeadings.push(newHeading);
			data = data.slice(0, insertPos) + newHeading + data.slice(insertPos);
			insertPos += newHeading.length;
		}

		currentLevel++;
	}

	await vault.modify(file, data.trim() + '\n');
	return insertedHeadings;
};

const focusBelowInsertedHeading = async (app: App, file: TFile, insertedHeading: string): Promise<void> => {
	const leaf = app.workspace.getLeaf(true);
	await leaf.openFile(file);

	// Get the editor instance for the opened file
	const view = app.workspace.getActiveViewOfType(MarkdownView);
	if (!view) {
		return;
	}
	const editor = view.editor;

	// Find the inserted heading line
	const lines = editor.getValue().split('\n');
	const lineIndex = lines.findIndex((line) => line.trim() === insertedHeading.trim());

	if (lineIndex !== -1) {
		// Place the cursor *below* the inserted heading
		editor.setCursor({ line: lineIndex + 1, ch: 0 });
		editor.scrollIntoView({ from: { line: lineIndex + 1, ch: 0 }, to: { line: lineIndex + 1, ch: 0 } }, true);
	}
};

const findSectionStart = (data: string, headings: string[], level: number): number => {
	const heading = headings[headings.length - 1];
	const headingRegex = new RegExp(`^#{${level}} ${escapeRegExp(heading)}$`, 'm');
	const match = data.match(headingRegex);
	if (match) {
		return match.index!;
	}
	return 0;
};

const findSectionEnd = (data: string, startIndex: number, currentLevel: number): number => {
	// Look for next heading of same or higher level
	const nextHeadingRegex = new RegExp(`^#{1,${currentLevel}}\\s+.+$`, 'm');
	const substring = data.slice(startIndex + 1);
	const match = substring.match(nextHeadingRegex);
	return match ? startIndex + 1 + match.index! : -1;
};

const sortSections = async (plugin: RpgPlayerNotesPlugin, file: TFile, parentHeadings: string[], level: number): Promise<void> => {
	let data = await plugin.app.vault.read(file);
	const parentLevel = level - 1;

	// Identify parent section boundaries

	if (parentHeadings.length > 0) {
		const parentStart = findSectionStart(data, parentHeadings, parentLevel);
		const parentEnd = findSectionEnd(data, parentStart, parentLevel);
		const section = data.slice(parentStart, parentEnd >= 0 ? parentEnd : data.length);

		// Find the headings at the current level
		const headingRegex = new RegExp(`^#{${level}} (.+)$`, 'gm');
		const matches = [...section.matchAll(headingRegex)];
		if (matches.length < 2) {
			// Just one section, nothing to sort
			return;
		}

		const sections: NoteSection[] = [];
		for (let i = 0; i < matches.length; i++) {
			const start = matches[i].index;
			const end = i < matches.length - 1 ? matches[i + 1].index : section.length;
			const title = matches[i][1].trim();
			const text = section.slice(start, end).trimEnd();
			sections.push({ title, start, end, text });
		}

		// Sort sections alphabetically by title
		//		sections.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: false, sensitivity: 'base' }));
		if (plugin.settings.keepNoteSectionsSorted) {
			if (plugin.settings.sortingMode === 'custom' && plugin.settings.customSortingRegex) {
				const regex = new RegExp(plugin.settings.customSortingRegex, 'gi');
				const customComparator: ComparatorFn = (a, b) => a.title.replace(regex, '').localeCompare(b.title.replace(regex, ''), undefined, { sensitivity: 'base' });
				sections.sort(customComparator);
			} else {
				sections.sort(sectionSortComparators[plugin.settings.sortingMode] ?? sectionSortComparators.default);
			}
		}

		// Rebuild parent with sorted sections
		const sortedSection = section.slice(0, matches[0].index) + sections.map((s) => s.text).join('\n\n') + '\n';

		// Replace the unsorted section in the file with the new sorted section
		const newData = data.slice(0, parentStart) + sortedSection + data.slice(parentEnd >= 0 ? parentEnd : data.length);

		await plugin.app.vault.modify(file, newData);
	}
};

const parseNoteTarget = (plugin: RpgPlayerNotesPlugin, type: NoteType, title: string, currentFile: TFile): ParsedNoteTarget => {
	let path: string = replaceTokens(type.path, plugin.settings);

	if (!path.startsWith('/')) {
		// Path is relative to the top folder of the current note
		path = `${currentFile.path.split('/')[0]}/${path}`;
	}

	path = normalizePath(path);

	if (!path.contains('#')) {
		// Just a path to create a new note in
		return {
			headings: [],
			notePath: normalizePath(`${path}/${title}.md`)
		};
	}
	// Any number of #'s in the path denotes that the last directory before the first # is actually a note
	const dirs = path.substring(0, path.lastIndexOf('/')).split('/');

	const noteParts = path
		.substring(path.lastIndexOf('/') + 1)
		.split('#')
		.filter(Boolean);

	noteParts.push(title);

	const note = noteParts.shift();
	if (typeof note === 'undefined') {
		new Notice(`ERROR: The path for note type "${type.name}" is invalid`);
	}

	return {
		notePath: normalizePath(`${dirs.join('/')}/${note}.md`),
		headings: noteParts.map((h) => h.trim())
	};
};

const openFileAccordingToSettings = async (plugin: RpgPlayerNotesPlugin, filePath: string) => {
	const noteFile = plugin.app.vault.getAbstractFileByPath(filePath);
	if (noteFile instanceof TFile) {
		let leaf: WorkspaceLeaf;
		switch (plugin.settings.splitDirection) {
			case 'horizontal':
			case 'vertical':
				leaf = plugin.app.workspace.getLeaf('split', plugin.settings.splitDirection);
				break;
			case 'none':
			default:
				leaf = plugin.app.workspace.getLeaf(true);
				break;
		}
		await leaf.openFile(noteFile);
		plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
	}
};

export const getAllTokens = (settings: RpnSettings) => {
	return [
		...BUILTIN_TOKENS,
		...settings.userTokens.map((t) => ({
			token: `{${t.token}}`,
			description: t.description,
			replace: () => {
				try {
					const fn = new Function(`return ${t.js};`);
					return String(fn());
				} catch (e) {
					console.error(`Error evaluating user token "${t.token}":`, e);
					return '';
				}
			}
		}))
	];
};

const replaceTokens = (path: string, settings: RpnSettings): string => {
	let result = path;
	for (const t of getAllTokens(settings)) {
		result = result.replaceAll(t.token, t.replace());
	}
	return result;
};
