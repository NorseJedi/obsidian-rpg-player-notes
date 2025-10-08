import { normalizePath, TFile, Vault, WorkspaceLeaf } from 'obsidian';
import RpgPlayerNotesPlugin from '@/main';

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

export const openFileAccordingToSettings = async (plugin: RpgPlayerNotesPlugin, filePath: string) => {
	const noteFile = plugin.app.vault.getAbstractFileByPath(filePath);
	if (noteFile instanceof TFile) {
		let leaf: WorkspaceLeaf;
		switch (plugin.settings.splitDirection) {
			case 'horizontal':
			case 'vertical':
				leaf = plugin.app.workspace.getLeaf('split', plugin.settings.splitDirection);
				break;
			case 'same':
			default:
				leaf = plugin.app.workspace.getLeaf(true);
				break;
		}
		await leaf.openFile(noteFile);
		plugin.app.workspace.setActiveLeaf(leaf, { focus: true });
	}
};

String.prototype.toTitleCase = function (): string {
	return this.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase());
};
