import { App, PluginSettingTab, Setting } from 'obsidian';
import RpgPlayerNotesPlugin from '@/main';
import { NOTE_TYPES, NoteType } from '@/note-types';
import { SplitDirection } from '@/types/types';

export interface RpgPlayerNotesSettings {
	paths: Record<NoteType, string>;
	openNoteAfterCreation: boolean;
	splitDirection: SplitDirection;
}

export const DEFAULT_SETTINGS: RpgPlayerNotesSettings = {
	paths: NOTE_TYPES.reduce(
		(acc, type) => {
			let folder = 'Compendium/';
			switch (type) {
				case 'person':
					folder += 'People';
					break;
				case 'creature':
					folder += 'Beastiary';
					break;
				case 'location':
					folder += 'Places';
					break;
				default:
					folder += type.toTitleCase() + 's'; // default folder = plural of type
			}
			acc[type] = folder;
			return acc;
		},
		{} as Record<NoteType, string>
	),
	openNoteAfterCreation: true,
	splitDirection: 'same'
};

export class RpgPlayerNotesSettingsTab extends PluginSettingTab {
	plugin: RpgPlayerNotesPlugin;

	constructor(app: App, plugin: RpgPlayerNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName('RPG Player Notes Settings').setHeading();

		for (const type of NOTE_TYPES) {
			new Setting(containerEl).setName(type.toTitleCase()).addText((text) =>
				text
					.setPlaceholder(`Folder for ${type.toTitleCase()} notes`)
					.setValue(this.plugin.settings.paths[type])
					.onChange(async (value) => {
						this.plugin.settings.paths[type] = value.trim();
						await this.plugin.saveSettings();
					})
			);
		}

		new Setting(containerEl)
			.setName('Open new note after creation')
			.setDesc('Automatically open the new note once it’s created.')
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.openNoteAfterCreation).onChange(async (value) => {
					this.plugin.settings.openNoteAfterCreation = value;
					await this.plugin.saveSettings();

					// Show or hide the split direction setting
					splitSetting.setDisabled(!value);
					splitSetting.settingEl.style.display = value ? '' : 'none';
				})
			);

		const splitSetting = new Setting(containerEl)
			.setName('Split direction')
			.setDesc('Choose where the note opens: same tab, vertical split, or horizontal split.')
			.addDropdown((dropdown) => {
				NOTE_TYPES;
				dropdown
					.addOption('same', 'Same tab group')
					.addOption('vertical', 'Vertical split')
					.addOption('horizontal', 'Horizontal split')
					.setValue(this.plugin.settings.splitDirection)
					.onChange(async (value) => {
						this.plugin.settings.splitDirection = value as SplitDirection;
						await this.plugin.saveSettings();
					});
			});

		if (!this.plugin.settings.openNoteAfterCreation) {
			splitSetting.settingEl.style.display = 'none';
		}
	}
}
