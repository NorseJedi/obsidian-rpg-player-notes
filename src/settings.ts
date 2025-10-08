import { App, PluginSettingTab, Setting } from 'obsidian';
import RpgPlayerNotesPlugin from '@/main';

export interface NoteTypePaths {
	person: string;
	location: string;
	creature: string;
	event: string;
}

export interface RpgPlayerNotesSettings {
	paths: NoteTypePaths;
}

export const DEFAULT_SETTINGS: RpgPlayerNotesSettings = {
	paths: {
		person: 'Compendium/People',
		location: 'Compendium/Places',
		creature: 'Compendium/Bestiary',
		event: 'Compendium/Events'
	}
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
		containerEl.createEl('h2', { text: 'Note Type Paths' });

		const paths = ['person', 'location', 'creature', 'event'] as const;

		for (const type of paths) {
			new Setting(containerEl).setName(type.charAt(0).toUpperCase() + type.slice(1)).addText((text) =>
				text
					.setPlaceholder(`Folder for ${type} notes`)
					.setValue(this.plugin.settings.paths[type])
					.onChange(async (value) => {
						this.plugin.settings.paths[type] = value.trim();
						await this.plugin.saveSettings();
					})
			);
		}
	}
}
