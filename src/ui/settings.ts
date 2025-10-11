import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { SplitDirection } from '../constants/split-direction';
import { addToggleAndReturn, bindVisibilityToToggle, nanoid } from '../helpers';
import RpgPlayerNotesPlugin from '../main';
import { NoteTypeEditModal } from './edit-note-type.modal';
import { UserTokenModal } from './edit-user-token.modal';

export class RpgPlayerNotesSettingsTab extends PluginSettingTab {
	plugin: RpgPlayerNotesPlugin;

	constructor(app: App, plugin: RpgPlayerNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		//		new Setting(containerEl).setName('RPG Player Notes Settings').setHeading();

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

		new Setting(containerEl).setName('Note types').setHeading();

		this.plugin.settings.noteTypes.forEach((type, index) => {
			const typeSetting = new Setting(containerEl).setName(`${type.label}`).setDesc(`Path: ${type.path}`);

			typeSetting.addButton((btn) =>
				btn
					.setIcon('edit')
					.setTooltip('Edit note type')
					.onClick(() => this.editNoteTypeModal(index))
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
				.onClick(() => this.editNoteTypeModal())
		);

		new Setting(containerEl).setName('Custom tokens').setHeading().setDesc('User-defined {TOKENS} that can be used in paths. See the Edit Note Type or Add New Note Type dialog for a list plugin defined tokens.');

		this.plugin.settings.userTokens.forEach((token, index) => {
			const typeSetting = new Setting(containerEl).setName(`{${token.token}}`).setDesc(`${token.description}`);

			typeSetting.addButton((btn) =>
				btn
					.setIcon('edit')
					.setTooltip('Edit token')
					.onClick(() => this.editTokenModal(index))
			);

			typeSetting.addButton((btn) =>
				btn
					.setIcon('trash')
					.setTooltip('Delete token')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.userTokens.splice(index, 1);
						await this.plugin.saveSettings();
						this.display(); // refresh
					})
			);
		});

		new Setting(containerEl).addButton((btn) =>
			btn
				.setIcon('plus')
				.setTooltip('Add new token')
				.setCta()
				.onClick(() => this.editTokenModal())
		);

		//			.addButton((btn) => btn.setButtonText('Manage').onClick(() => new UserTokenModal(this.plugin).open()));
	}

	private editNoteTypeModal(index?: number) {
		const { noteTypes } = this.plugin.settings;
		const existing = index != null ? noteTypes[index] : { id: nanoid(), label: '', path: '' };

		const modal = new NoteTypeEditModal(this.plugin, existing, async (updated) => {
			if (index != null) {
				noteTypes[index] = updated;
			} else {
				const noteTypeExists = this.plugin.settings.noteTypes.find((t) => t.label === updated.label);
				if (noteTypeExists) {
					new Notice(`A note type named "${updated.label}" already exists.`);
					return;
				}
				this.plugin.settings.noteTypes.push(updated);
			}
			await this.plugin.saveSettings();
			this.display();
		});

		modal.open();
	}

	private editTokenModal(index?: number) {
		const { userTokens } = this.plugin.settings;
		const existing = index != null ? userTokens[index] : { token: '', description: '', js: '' };

		const modal = new UserTokenModal(this.plugin, existing, async (updated) => {
			if (index != null) {
				userTokens[index] = updated;
			} else {
				userTokens.push(updated);
			}
			await this.plugin.saveSettings();
			this.display();
		});

		modal.open();
	}
}
