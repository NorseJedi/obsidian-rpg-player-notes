import { App, PluginSettingTab, Setting } from 'obsidian';
import { NoteTypeEditModal } from '@/edit-node-type';
import { addToggleAndReturn, bindVisibilityToToggle } from '@/helpers';
import RpgPlayerNotesPlugin from '@/main';

export type SplitDirection = 'same' | 'vertical' | 'horizontal';

export interface NoteType {
	id: string; // unique key (e.g. "person")
	label: string; // Display label (e.g. "Person")
	path: string; // Foler path relative to top level folder
}

export interface RpgPlayerNotesSettings {
	openNoteAfterCreation: boolean;
	splitDirection: SplitDirection;
	noteTypes: NoteType[];
}

export const DEFAULT_SETTINGS: RpgPlayerNotesSettings = {
	openNoteAfterCreation: true,
	splitDirection: 'same',
	noteTypes: [
		{ id: 'person', label: 'Person', path: 'Compendium/People' },
		{ id: 'location', label: 'Location', path: 'Compendium/Locations' },
		{ id: 'item', label: 'Item', path: 'Items' },
		{ id: 'creature', label: 'Creature', path: 'Compendium/Creatures' },
		{ id: 'event', label: 'Event', path: 'Compendium/Events' },
		{ id: 'group', label: 'Group', path: 'Compendium/Groups' }
	]
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

		const openSetting = new Setting(containerEl).setName('Open new note after creation').setDesc('Automatically open the new note once it’s created.');
		const openToggle = addToggleAndReturn(openSetting, this.plugin.settings.openNoteAfterCreation, async (value) => {
			this.plugin.settings.openNoteAfterCreation = value;
			await this.plugin.saveSettings();
		});

		const splitSetting = new Setting(containerEl)
			.setName('Split direction')
			.setDesc('Choose where the note opens: same tab, vertical split, or horizontal split.')
			.addDropdown((dropdown) => {
				//				NOTE_TYPES;
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

		bindVisibilityToToggle(openToggle, splitSetting, this.plugin.settings.openNoteAfterCreation);

		new Setting(containerEl).setName('Note Types').setHeading();

		this.plugin.settings.noteTypes.forEach((type, index) => {
			const typeSetting = new Setting(containerEl).setName(`${type.label}`).setDesc(`Path: ${type.path}`);

			typeSetting.addButton((btn) =>
				btn
					.setIcon('edit')
					.setTooltip('Edit note type')
					.onClick(() => this.openEditModal(index))
			);

			typeSetting.addButton((btn) =>
				btn
					.setIcon('trash')
					.setTooltip('Delete note type')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.noteTypes.splice(index, 1);
						await this.plugin.saveSettings();
						this.display(); // refresh
					})
			);
		});

		new Setting(containerEl).addButton((btn) =>
			btn
				.setIcon('plus')
				.setTooltip('Add new note type')
				.setCta()
				.onClick(() => this.openEditModal())
		);
	}

	private openEditModal(index?: number) {
		const { noteTypes } = this.plugin.settings;
		const existing = index != null ? noteTypes[index] : { id: '', label: '', path: '' };

		const modal = new NoteTypeEditModal(this.app, existing, async (updated) => {
			if (index != null) noteTypes[index] = updated;
			else noteTypes.push(updated);
			await this.plugin.saveSettings();
			this.display();
		});

		modal.open();
	}
}
