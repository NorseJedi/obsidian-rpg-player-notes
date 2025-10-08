import { Editor, MarkdownFileInfo, MarkdownView, Notice, normalizePath } from 'obsidian';
import { ensureFolderExists, openFileAccordingToSettings } from '@/helpers';
import RpgPlayerNotesPlugin from '@/main';
import { NoteType } from '@/note-types';

export const createCompendiumNote = async (plugin: RpgPlayerNotesPlugin, editor: Editor, ctx: MarkdownView | MarkdownFileInfo, title: string, type: NoteType, replaceSelection: boolean) => {
	const currentFile = ctx.file;
	if (!currentFile) return;

	const vault = plugin.app.vault;

	// Find the top-level folder under the vault root for the current note
	const parts = currentFile.path.split('/');
	if (parts.length < 2) {
		new Notice('Note is in root; cannot determine base folder.');
		return;
	}
	const topFolder = parts[0];

	// Construct the new note path relative to the top folder
	const relativeFolder = plugin.settings.paths[type];
	const newFolderPath = normalizePath(`${topFolder}/${relativeFolder}`);
	const newNotePath = normalizePath(`${newFolderPath}/${title}.md`);

	// Ensure the folder exists
	await ensureFolderExists(plugin.app.vault, newFolderPath);

	// Create the new note
	if (!(await vault.adapter.exists(newNotePath))) {
		await vault.create(newNotePath, '');
	}

	if (replaceSelection) {
		// Replace selection with a link
		editor.replaceSelection(`[[${title}]]`);
	} else {
		const cursor = editor.getCursor();
		editor.replaceRange(`[[${title}]]`, cursor);
	}

	new Notice(`Created ${type} note: ${title}`);

	if (plugin.settings.openNoteAfterCreation) {
		await openFileAccordingToSettings(plugin, newNotePath);
	}
};
