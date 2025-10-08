import { normalizePath, Vault } from 'obsidian';

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
