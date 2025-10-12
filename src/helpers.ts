import { Notice, normalizePath, TFile, Vault, WorkspaceLeaf } from 'obsidian';
import { BUILTIN_TOKENS } from './constants/tokens';
import RpgPlayerNotesPlugin from './main';
import { NoteType, ParsedNoteTarget, RpnSettings } from './types/rpg-player-notes';

export const ensureFolderExists = async (vault: Vault, folderPath: string): Promise<void> => {
	const adapter = vault.adapter;

	// Normalize for consistent slashes
	folderPath = normalizePath(folderPath);

	// If it already exists, nothing to do
	if (await adapter.exists(folderPath)) {
		return;
	}

	// Recursively ensure parent exists
	const parent = folderPath.split('/').slice(0, -1).join('/');
	if (parent && !(await adapter.exists(parent))) {
		await ensureFolderExists(vault, parent);
	}

	// Create this folder
	await vault.createFolder(folderPath);
};

export const ensureNoteExists = async (vault: Vault, notePath: string): Promise<TFile> => {
	const existing = vault.getAbstractFileByPath(notePath);
	if (existing instanceof TFile) {
		return existing;
	}

	await ensureFolderExists(vault, notePath.substring(0, notePath.lastIndexOf('/')));

	return await vault.create(notePath, '');
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

export const replaceTokens = (path: string, settings: RpnSettings): string => {
	let result = path;
	for (const t of getAllTokens(settings)) {
		result = result.replaceAll(t.token, t.replace());
	}
	return result;
};

export const openFileAccordingToSettings = async (plugin: RpgPlayerNotesPlugin, filePath: string) => {
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

export const nanoid = (size = 21) => {
	const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
	let id = '';
	let bytes = crypto.getRandomValues(new Uint8Array((size |= 0)));
	while (size--) {
		id += urlAlphabet[bytes[size] & 63];
	}
	return id;
};

export const parseNoteTarget = (plugin: RpgPlayerNotesPlugin, type: NoteType, title: string, currentFile: TFile): ParsedNoteTarget => {
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

export const escapeRegExp = (str: string): string => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
