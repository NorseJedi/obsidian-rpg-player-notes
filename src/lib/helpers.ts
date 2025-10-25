import { moment, normalizePath, TFile, Vault } from 'obsidian';
import { BUILTIN_TOKENS } from '../constants/tokens';
import { ReplacementToken, RpnSettings } from '../types/rpg-player-notes';

/**
 * Ensures that a folder exists at the specified path within the provided vault.
 * If the folder or its parent folders do not exist, they are created recursively.
 *
 * @param {Vault} vault - The Vault instance in which the folder is to be ensured.
 * @param {string} folderPath - The path of the folder to ensure exists.
 * @returns {Promise<void>} A promise that resolves when the folder and its parent folders, if necessary, are created.
 * @throws {Error} Throws an error if folder creation fails.
 */
export const ensureFolderExists = async (vault: Vault, folderPath: string): Promise<void> => {
	const adapter = vault.adapter;

	// Normalise for consistent slashes
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
 * Ensures that a note exists at the specified path within the vault.
 *
 * If a note already exists at the given path, it returns the note. If not, it
 * creates any missing folder structure along the path and then creates an empty
 * note at the specified location.
 *
 * @param {Vault} vault - The vault in which the note is to be ensured.
 * @param {string} notePath - The path where the note should exist or be created.
 * @returns {Promise<TFile>} A promise that resolves to the note file at the specified path.
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
 * Generates a unique, random, URL-safe string ID using a custom alphabet.
 * See https://github.com/ai/nanoid
 *
 * @param {number} [size=21] - The length of the ID to generate. Defaults to 21 characters.
 * @returns {string} A unique string ID consisting of characters from a predefined URL-safe alphabet.
 */
export const nanoid = (size: number = 21): string => {
	const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
	let id = '';
	let bytes = crypto.getRandomValues(new Uint8Array((size |= 0)));
	while (size--) {
		id += urlAlphabet[bytes[size] & 63];
	}
	return id;
};

/**
 * Escapes special characters in a string to be used in a regular expression.
 *
 * This function takes a string and escapes characters that have special meaning
 * in regular expressions, such as ., *, +, ^, $, {, }, (, ), |, [, ], and \.
 * This ensures that the input string is treated as a literal match rather than
 * being interpreted as part of a regular expression pattern.
 *
 * @param {string} str - The input string to escape.
 * @returns {string} - The escaped string with special characters prefixed by a backslash.
 */
export const escapeRegExp = (str: string): string => {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Retrieves all tokens, combining built-in tokens and user-defined tokens.
 *
 * @param {RpnSettings} settings - The configuration object containing user-defined tokens.
 * @returns {ReplacementToken[]} An array of replacement tokens that includes both built-in and user-defined tokens.
 */
export const getAllTokens = (settings: RpnSettings): ReplacementToken[] => {
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

/**
 * Replaces all tokens in the given path string based on the provided settings.
 * Tokens are identified and replaced using the `getAllTokens` method, which
 * generates a list of token-replacement pairs from the settings.
 *
 * @param {string} path - The string containing tokens to be replaced.
 * @param {RpnSettings} settings - An object containing configuration and data
 *                                  used to generate the token-replacement pairs.
 * @returns {string} The updated string with all specified tokens replaced.
 */
export const replaceTokens = (path: string, settings: RpnSettings): string => {
	let result = path;
	for (const t of getAllTokens(settings)) {
		result = result.replaceAll(t.token, t.replace());
	}
	return result;
};

export const getStringAsMoment = (str: string, dateFormat?: string): moment.Moment | null => {
	let parsed: moment.Moment | null = null;

	for (let i = str.length; i > 0; i--) {
		const substring = str.substring(0, i);
		let m: moment.Moment;

		if (!dateFormat) {
			m = moment(substring, true);
		} else {
			m = moment(substring, dateFormat, true);
		}

		if (m.isValid()) {
			parsed = m;
			break;
		}
	}

	return parsed;
}
