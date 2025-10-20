import { Editor, MarkdownFileInfo, MarkdownView, Notice, normalizePath, TAbstractFile, TFile } from 'obsidian';
import { ensureNoteExists, escapeRegExp, replaceTokens } from '../lib/helpers';
import RpgPlayerNotesPlugin from '../main';
import { NoteType, ParsedNoteTarget } from '../types/rpg-player-notes';
import { SectionSorter } from './section-sorter';

/**
 * Represents a compendium note that can be created, managed, and linked to from the editor.
 * Handles the creation of notes with optional headings, linking them back to the original source file,
 * and operational settings such as opening the note after creation or sorting note sections.
 */
export class CompendiumNote {
	private readonly sourceFile: TFile | null = null;
	private targetFile: TFile | null = null;

	constructor(
		private plugin: RpgPlayerNotesPlugin,
		private editor: Editor,
		private context: MarkdownView | MarkdownFileInfo,
		private title: string,
		private noteType: NoteType,
		private replaceSelection: boolean
	) {
		if (!this.context.file) {
			console.error("No current file - it's a mystery how we even got here...");
			return;
		}
		this.sourceFile = this.context.file;
	}

	/**
	 * Creates a new note or heading in the specified location and inserts a link to it in the editor.
	 *
	 * This method ensures the note exists at the specified path, creates a heading if necessary,
	 * and inserts a link to the note or heading into the editor. Depending on the settings,
	 * it may also open or activate the newly created note.
	 *
	 * @return {Promise<void>} Resolves when the note creation and related operations are complete.
	 */
	public async create(): Promise<void> {
		let linkTarget: string;
		let insertedHeadings: string[] = [];
		const target = this.resolvePath();
		this.targetFile = await ensureNoteExists(this.plugin.app.vault, target.notePath);
		if (target.headings.length > 0) {
			({ insertedHeadings, linkTarget } = await this.createHeading(target));
		} else {
			const link = this.plugin.app.metadataCache.fileToLinktext(this.targetFile, '', true);
			linkTarget = `${link}|${this.title}`;
		}

		if (this.replaceSelection) {
			this.editor.replaceSelection(`[[${linkTarget}]]`);
		} else {
			this.editor.replaceRange(`[[${linkTarget}]]`, this.editor.getCursor());
		}

		if (this.plugin.settings.openNoteAfterCreation) {
			await this.openOrActivateNote(insertedHeadings.last() ?? '');
		}
	}

	/**
	 * Resolves and constructs a fully qualified note path based on the provided note type configuration,
	 * the current note's file structure, and the plugin settings. This method handles both absolute and
	 * relative paths, ensures normalisation, and splits the path to include sections, directories, or headings.
	 *
	 * @return {ParsedNoteTarget} An object containing the normalised note path and an array of headings.
	 * @throws {Error} If there is no source file available for path resolution.
	 */
	private resolvePath(): ParsedNoteTarget {
		if (!this.sourceFile) {
			throw new Error('No source file');
		}

		let path = replaceTokens(this.noteType.path, this.plugin.settings);

		if (!path.startsWith('/')) {
			// Path is relative to the top folder of the current note
			path = `${this.sourceFile.path.split('/')[0]}/${path}`;
		}

		path = normalizePath(path);

		if (!path.contains('#')) {
			// Path indicates a new note without sections
			return {
				headings: [],
				notePath: normalizePath(`${path}/${this.title}.md`)
			};
		}

		// We have a path with both directories, notes, and sections.
		// Extract the directory parts
		const dirs = path.substring(0, path.lastIndexOf('/')).split('/');

		// Extract the note part and the headings
		const noteParts = path
			.substring(path.lastIndexOf('/') + 1)
			.split('#')
			.filter(Boolean);

		noteParts.push(this.title);

		// Extract the note part leaving the headings
		const note = noteParts.shift();

		if (typeof note !== 'string') {
			console.error('The path for the note type %s is invalid: %s', this.noteType.name, this.noteType.path);
			new Notice(`ERROR: The path for the note type ${this.noteType.name} is invalid: ${this.noteType.path}`);
		}

		return {
			headings: noteParts.map((h) => h.trim()),
			notePath: normalizePath(`${dirs.join('/')}/${note}.md`)
		};
	}

	/**
	 * Creates a heading based on the provided target, normalising the path and appending it under specified headings.
	 *
	 * @param {ParsedNoteTarget} target - The target information that includes a note path and headings.
	 * @return {Promise<{ linkTarget: string, insertedHeadings: string[] }>} An object containing the normalised link target and the appended headings.
	 */
	private async createHeading(target: ParsedNoteTarget): Promise<{ linkTarget: string; insertedHeadings: string[] }> {
		const linkTarget = normalizePath(`${target.notePath}#${target.headings.join('#')}|${this.title}`);
		const insertedHeadings = await this.appendUnderHeadings(target.headings);
		return { linkTarget, insertedHeadings };
	}

	/**
	 * Appends or inserts headings under specified levels in a target file.
	 * If a heading already exists, calculates the appropriate insert position
	 * within that section. If the heading does not exist, a new heading is added
	 * with proper spacing.
	 *
	 * @param {string[]} headings - An array of heading strings to be appended or inserted.
	 * @return {Promise<string[]>} A promise that resolves to an array of headings
	 *                              that were processed or newly inserted.
	 */
	private async appendUnderHeadings(headings: string[]): Promise<string[]> {
		const insertedHeadings: string[] = [];
		let insertLineNum = 0;

		await this.plugin.app.vault.process(this.targetFile!, (data) => {
			let lines = data.split('\n');
			let currentLevel = 1;
			let insertLine = lines.length; // Default: append at the end

			for (const heading of headings) {
				const headingRegex = new RegExp(`^#{${currentLevel}} {1,}${escapeRegExp(heading)}$`, 'm');
				const existingLineIndex = lines.findIndex((line) => headingRegex.test(line));

				if (existingLineIndex !== -1) {
					// Heading exists, find where its section ends
					insertLine = this.findSectionEnd(data, existingLineIndex, currentLevel);
					insertedHeadings.push(lines[existingLineIndex]);
				} else {
					// Insert a new heading at the current insert line
					const newHeading = `${'#'.repeat(currentLevel)} ${heading}`;
					insertedHeadings.push(newHeading);

					// Ensure spacing around inserted headings
					const before = lines.slice(0, insertLine).join('\n').trimEnd();
					const after = lines.slice(insertLine).join('\n').trimStart();

					data = before + (before.trim() !== '' ? `\n\n` : '') + `${newHeading}\n\n` + after;

					// Rebuild the line array after insertion
					lines = data.split('\n');
					insertLine = lines.findIndex((line) => line.trim() === newHeading.trim()) + 1;
					insertLineNum = insertLine - 1;
				}

				currentLevel++;
			}

			return data;
		});

		if (this.plugin.settings.keepNoteSectionsSorted) {
			const sorter = new SectionSorter(this.plugin);
			await sorter.sortSections(this.targetFile!, { lineNumber: insertLineNum });
		}

		return insertedHeadings;
	}

	/**
	 * Finds the ending line index of a section in a Markdown file based on the given starting line and heading level.
	 *
	 * @param {string} data - The entire content of the Markdown file as a string.
	 * @param {number} startLine - The line index (0-based) where the section starts.
	 * @param {number} headingLevel - The level of the heading defining the start of the section (e.g. 1 for #, 2 for ##).
	 * @return {number} The line index (0-based) where the section ends. If no later heading of the same or higher level is found, the end of the file index is returned.
	 */
	private findSectionEnd(data: string, startLine: number, headingLevel: number): number {
		const lines = data.split('\n');

		// Look for the next heading of the same or higher level
		for (let i = startLine + 1; i < lines.length; i++) {
			const line = lines[i];
			if (/^#+\s+/.test(line)) {
				// Determine heading level
				const level = line.match(/^#+/)![0].length;
				if (level <= headingLevel) {
					// Found a heading of the same or higher level, stop before this one
					return i;
				}
			}
		}

		// If no next heading, return the end of the file
		return lines.length;
	}

	/**
	 * Opens the specified note or activates it if it is already open.
	 * Places the cursor below the specified heading if it exists in the note.
	 *
	 * @param {string} insertedHeading - The heading to locate in the note and position the cursor below.
	 * @return {Promise<void>} A promise that resolves when the note is opened, activated, and the cursor is positioned appropriately.
	 */
	private async openOrActivateNote(insertedHeading: string): Promise<void> {
		const { workspace } = this.plugin.app;

		let leaf = workspace.getLeavesOfType('markdown').find((leaf) => {
			const viewState = leaf.getViewState();
			return viewState.state?.file === this.targetFile?.path;
		});

		let openedExisting = !!leaf;

		if (leaf) {
			workspace.setActiveLeaf(leaf, { focus: true });
		} else {
			switch (this.plugin.settings.splitDirection) {
				case 'horizontal':
				case 'vertical':
					leaf = workspace.getLeaf('split', this.plugin.settings.splitDirection);
					break;
				default:
					leaf = workspace.getLeaf('tab');
					break;
			}
			await leaf.openFile(this.targetFile!);
		}

		if (openedExisting) {
			// Wait for metadata to refresh before placing the cursor, otherwise it will get placed based on the content before adding the new header.
			await this.waitForMetadataRefresh();
		}

		// Get the editor instance for the opened file
		const view = workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			return;
		}
		const editor = view.editor;

		// Find the inserted heading line
		const lines = editor.getValue().split('\n');
		const lineIndex = lines.findIndex((line) => line.trim() === insertedHeading.trim());

		if (lineIndex !== -1) {
			// Place the cursor below the inserted heading
			editor.setCursor({ line: lineIndex + 1, ch: 0 });
			editor.scrollIntoView(
				{
					from: { line: lineIndex + 1, ch: 0 },
					to: { line: lineIndex + 1, ch: 0 }
				},
				true
			);
		}
	}

	/**
	 * Waits for the metadata of a target file to be refreshed after changes.
	 * Listens for a 'changed' event from the metadata cache and resolves the promise
	 * when the target file's metadata is updated or after a timeout.
	 *
	 * @return {Promise<void>} A promise that resolves when the metadata of the target file is refreshed or the timeout is reached.
	 */
	private async waitForMetadataRefresh(): Promise<void> {
		const { metadataCache } = this.plugin.app;
		const timeoutMs = 1500;

		let resolved = false;

		return new Promise((resolve): void => {
			const onChanged = (...args: unknown[]) => {
				const file = args[0] as TAbstractFile | undefined;
				if (file instanceof TFile && file.path === this.targetFile?.path) {
					resolved = true;
					metadataCache.off('changed', onChanged);
					resolve();
				}
			};

			metadataCache.on('changed', onChanged);

			setTimeout(() => {
				if (!resolved) {
					metadataCache.off('changed', onChanged);
					resolve();
				}
			}, timeoutMs);
		});
	}
}
