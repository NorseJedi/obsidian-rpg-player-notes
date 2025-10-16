import { Editor, TFile } from 'obsidian';
import RpgPlayerNotesPlugin from './main';
import { SelectHeadingModal } from './ui/select-heading-modal';
import { SelectNoteModal } from './ui/select-note-modal';

export const linkSelection = async (plugin: RpgPlayerNotesPlugin, editor: Editor) => {
	const selectedText = editor.getSelection();
	if (!selectedText) {
		return;
	}

	const targetNote = await selectNote(plugin);
	if (!targetNote) {
		return;
	}

	const heading = await selectHeading(plugin, targetNote);

	const link = heading ? `[[${targetNote.path}#${heading}|${selectedText}]]` : `[[${targetNote.path}|${selectedText}]]`;

	editor.replaceSelection(link);
};

const selectNote = async (plugin: RpgPlayerNotesPlugin): Promise<TFile | null> => {
	return new Promise((resolve) => {
		new SelectNoteModal(plugin, (result) => resolve(result)).open();
	});
};

const selectHeading = async (plugin: RpgPlayerNotesPlugin, note: TFile): Promise<string | null> => {
	const cache = plugin.app.metadataCache.getFileCache(note);
	const headingsFromCache = cache?.headings?.map((h) => ({ heading: h.heading, line: h.position?.start.line ?? 0 })) ?? [];

	// If we have no headings in the cache, fall back to scanning file text
	let headingEntries: { heading: string; line: number }[] = headingsFromCache.length
		? headingsFromCache
		: await (async () => {
				const content = await plugin.app.vault.read(note);
				const lines = content.split(/\r?\n/);
				const list: { heading: string; line: number }[] = [];
				for (let i = 0; i < lines.length; i++) {
					const m = lines[i].match(/^\s*(#{1,6})\s+(.+)$/);
					if (m) list.push({ heading: m[2].trim(), line: i });
				}
				return list;
			})();

	if (headingEntries.length === 0) {
		return null;
	}

	// Build previews (read a few lines after each heading)
	const content = await plugin.app.vault.read(note);
	const allLines = content.split(/\r?\n/);

	const headings = headingEntries.map((e) => e.heading);
	const previews = new Map<string, string>();
	for (const e of headingEntries) {
		const previewParts: string[] = [];
		for (let i = e.line + 1; i < Math.min(allLines.length, e.line + 6); i++) {
			// stop if next heading encountered
			if (/^\s*#{1,6}\s+/.test(allLines[i])) break;
			if (allLines[i].trim()) previewParts.push(allLines[i].trim());
			if (previewParts.join(' ').length >= 30) break;
		}
		const preview = previewParts.join(' ').slice(0, 30);
		if (preview) previews.set(e.heading, preview + (preview.length >= 30 ? '…' : ''));
	}

	return await new Promise<string | null>((resolve) => {
		const modal = new SelectHeadingModal(plugin, headings, previews, (result) => resolve(result));
		modal.open();
	});
};
