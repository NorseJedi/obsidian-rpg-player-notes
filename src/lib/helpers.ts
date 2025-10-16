import { normalizePath, TFile, Vault } from 'obsidian';

/**
 * Ensures that the given folder exists in the vault.
 * @param vault The vault to check.
 * @param folderPath The path of the folder to ensure.
 * @returns A promise that resolves when the folder is created or already exists.
 */
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

/**
 * Ensures that the given note exists in the vault.
 * @param vault The vault to check.
 * @param notePath The path of the note to ensure.
 * @returns A promise that resolves to the created or existing note.
 */
export const ensureNoteExists = async (vault: Vault, notePath: string): Promise<TFile> => {
	const existing = vault.getAbstractFileByPath(notePath);
	if (existing instanceof TFile) {
		return existing;
	}

	await ensureFolderExists(vault, notePath.substring(0, notePath.lastIndexOf('/')));

	return await vault.create(notePath, '');
};

/**
 * Generates a random ID using nanoid.
 * @param size The size of the ID (default is 21).
 * @returns A random ID string.
 * @see https://github.com/ai/nanoid
 */
export const nanoid = (size = 21) => {
	const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
	let id = '';
	let bytes = crypto.getRandomValues(new Uint8Array((size |= 0)));
	while (size--) {
		id += urlAlphabet[bytes[size] & 63];
	}
	return id;
};

/**
 * Escapes a string for use in a regular expression.
 * @param str
 */
export const escapeRegExp = (str: string): string => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};
