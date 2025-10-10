import { Editor, MarkdownFileInfo, MarkdownView, Notice, normalizePath } from 'obsidian';
import { NoteType } from './constants/note-type';
import { ensureFolderExists, openFileAccordingToSettings, replaceTokens } from './helpers';
import RpgPlayerNotesPlugin from './main';

export const createCompendiumNote = async (plugin: RpgPlayerNotesPlugin, editor: Editor, ctx: MarkdownView | MarkdownFileInfo, title: string, type: NoteType, replaceSelection: boolean) => {
	const vault = plugin.app.vault;
	const currentFile = ctx.file;

	if (!currentFile) {
		return;
	}

	let targetFolder: string;

	if (type.path.startsWith('/')) {
		// Path is absolute, use it verbatim
		targetFolder = normalizePath(type.path);
	} else {
		// Path is relative to the top folder of the current note
		const topFolder = currentFile.path.split('/')[0];
		targetFolder = normalizePath(`${topFolder}/${type.path}`);
	}

	// Replace predefined tokens in the folder name
	targetFolder = replaceTokens(targetFolder, plugin.settings);

	const newNotePath = normalizePath(`${targetFolder}/${title}.md`);

	// Ensure the folder exists
	await ensureFolderExists(plugin.app.vault, targetFolder);

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
