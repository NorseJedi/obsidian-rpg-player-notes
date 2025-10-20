import { Editor, TFile } from 'obsidian';
import { getCacheSafe } from 'obsidian-dev-utils/obsidian/MetadataCache';
import RpgPlayerNotesPlugin from '../main';
import { SelectHeadingModal } from '../ui/select-heading-modal';
import { SelectNoteModal } from '../ui/select-note-modal';

/**
 * The `LinkSelection` class is responsible for providing functionality to link selected text
 * in an editor to a specific note or heading within a note in the context of the RpgPlayerNotesPlugin.
 * It interacts with modals to allow users to select notes and headings and generates the appropriate
 * link to replace selected text in the editor.
 */
export class LinkSelection {
	constructor(
		private plugin: RpgPlayerNotesPlugin,
		private editor: Editor
	) {}

	/**
	 * Creates a link based on the selected text in the editor. If a target note and optionally a heading
	 * within the note are selected, it formats and inserts a link referencing the target note and heading.
	 *
	 * The method checks if there is a text selected in the editor. If no text is selected or no target note
	 * is chosen, the method does nothing. Otherwise, it formats the link accordingly and replaces the selected text
	 * with the generated link.
	 *
	 * @return {Promise<void>} A Promise that resolves when the link insertion process is complete,
	 * or resolves immediately if no action is taken.
	 */
	public async link(): Promise<void> {
		const selectedText = this.editor.getSelection();
		if (!selectedText) {
			return;
		}

		const targetNote = await this.selectNote();
		if (!targetNote) {
			return;
		}

		const heading = await this.selectHeading(targetNote);

		const link = heading ? `[[${targetNote.path}#${heading}|${selectedText}]]` : `[[${targetNote.path}|${selectedText}]]`;

		this.editor.replaceSelection(link);
	}

	/**
	 * Prompts the user with a modal to select a note and resolves with the selected note file.
	 *
	 * @return {Promise<TFile | null>} A promise that resolves to the selected note file (TFile) or null if no note is selected.
	 */
	private async selectNote(): Promise<TFile | null> {
		return new Promise((resolve) => {
			new SelectNoteModal(this.plugin, (result) => resolve(result)).open();
		});
	}

	/**
	 * Selects a heading from the given note (TFile). If no headings are cached,
	 * the method will extract headings from the file's text content. Once the headings
	 * are retrieved, a modal is displayed for the user to select a heading. Returns the
	 * selected heading or null if no heading is selected.
	 *
	 * @param {TFile} note - The file from which headings are to be selected.
	 * @return {Promise<string | null>} A promise resolving to the selected heading as a string or null if no heading is selected.
	 */
	private async selectHeading(note: TFile): Promise<string | null> {
		const cache = await getCacheSafe(this.plugin.app, note);
		const headingsFromCache = cache?.headings?.map((h) => ({ heading: h.heading, line: h.position?.start.line ?? 0 })) ?? [];

		// If we have no headings in the cache, fall back to scanning file text
		let headingEntries: { heading: string; line: number }[] = headingsFromCache.length
			? headingsFromCache
			: await (async () => {
					const content = await this.plugin.app.vault.read(note);
					const lines = content.split(/\r?\n/);
					const list: { heading: string; line: number }[] = [];
					for (let i = 0; i < lines.length; i++) {
						const m = lines[i].match(/^\s*(#{1,6})\s+(.+)$/);
						if (m) {
							list.push({ heading: m[2].trim(), line: i });
						}
					}
					return list;
				})();

		if (headingEntries.length === 0) {
			return null;
		}

		// Build previews (read a few lines after each heading)
		const content = await this.plugin.app.vault.read(note);
		const allLines = content.split(/\r?\n/);

		const headings = headingEntries.map((e) => e.heading);
		const previews = new Map<string, string>();
		for (const e of headingEntries) {
			const previewParts: string[] = [];
			for (let i = e.line + 1; i < Math.min(allLines.length, e.line + 6); i++) {
				// stop if next heading encountered
				if (/^\s*#{1,6}\s+/.test(allLines[i])) {
					break;
				}
				if (allLines[i].trim()) {
					previewParts.push(allLines[i].trim());
				}
				if (previewParts.join(' ').length >= 30) {
					break;
				}
			}
			const preview = previewParts.join(' ').slice(0, 30);
			if (preview) {
				previews.set(e.heading, preview + (preview.length >= 30 ? '…' : ''));
			}
		}

		return await new Promise<string | null>((resolve) => {
			const modal = new SelectHeadingModal(this.plugin, headings, previews, (result) => {
				resolve(result);
			});
			modal.open();
		});
	}
}
