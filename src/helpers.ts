import { normalizePath, Setting, TFile, ToggleComponent, Vault, WorkspaceLeaf } from 'obsidian';
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

/**
 * Binds a toggle control to show/hide another Setting row.
 * @param toggle The toggle element (from addToggle)
 * @param targetSetting The Setting whose visibility should change
 * @param initialValue Optional initial toggle value (used on render)
 */
export const bindVisibilityToToggle = (toggle: ToggleComponent, targetSetting: Setting, initialValue?: boolean) => {
	const updateVisibility = (visible: boolean) => {
		targetSetting.settingEl.style.display = visible ? '' : 'none';
	};

	// Apply initial visibility
	updateVisibility(initialValue ?? toggle.getValue());

	// React to toggle changes
	toggle.onChange(updateVisibility);
};

/**
 * Adds a toggle to a Setting and returns the ToggleComponent.
 * Simplifies capturing the instance for later use.
 */
export const addToggleAndReturn = (setting: Setting, initialValue: boolean, onChange: (value: boolean) => void): ToggleComponent => {
	let toggleRef: ToggleComponent | undefined;

	setting.addToggle((toggle) => {
		toggleRef = toggle;
		toggle.setValue(initialValue).onChange(onChange);
	});

	if (!toggleRef) {
		throw new Error('addToggleAndReturn: ToggleComponent was not created!');
	}
	return toggleRef;
};
