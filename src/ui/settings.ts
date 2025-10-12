import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { SORTING_MODES } from '../constants/sorting-modes';
import { nanoid } from '../helpers';
import RpgPlayerNotesPlugin from '../main';
import { NoteType, RpnSectionSortComparer, RpnSplitDirection, UserDefinedToken } from '../types/rpg-player-notes';
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

		new Setting(containerEl)
			.setName('Open new note after creation')
			.setDesc('Automatically open the new note once it’s created.')
			.addToggle(toggle =>
				toggle
					.setValue(this.plugin.settings.openNoteAfterCreation)
					.onChange(async (value) => {
						console.log('toggle changed', value);
						this.plugin.settings.openNoteAfterCreation = value;
						await this.plugin.saveSettings();
						showHideSplitSetting(value);
					})
			);

		const splitSetting = new Setting(containerEl)
			.setName('Split direction')
			.setDesc('Choose where the note opens: same tab, vertical split, or horizontal split.')
			.addDropdown(dropdown => {
				dropdown.addOption('same', 'Same tab group')
					.addOption('vertical', 'Vertical split')
					.addOption('horizontal', 'Horizontal split')
					.setValue(this.plugin.settings.splitDirection)
					.onChange(async value => {
						this.plugin.settings.splitDirection = value as RpnSplitDirection;
						await this.plugin.saveSettings();
					});
			});

		const showHideSplitSetting = (value: boolean) => {
			splitSetting.settingEl.style.display = value ? '' : 'none';
		};

		new Setting(containerEl)
			.setName('Keep sections sorted')
			.setDesc('Automatically keep sections sorted when adding notes as sections instead of new files. This will automatically sort the sections using the selected compare method, but only at the level where the new section is inserted.')
			.addToggle(toggle => {
				toggle.setValue(this.plugin.settings.keepNoteSectionsSorted)
					.onChange(async value => {
						this.plugin.settings.keepNoteSectionsSorted = value;
						await this.plugin.saveSettings();
						showHideSortingMode(value);
					});
			});

		const sortingModeSetting = new Setting(containerEl)
			.setName('Sorting mode')
			.setDesc('Choose how section headers are compared when sorting. The sorting is done alphabetically on the section header.')
			.addDropdown((dropdown) => {
				for (const option of SORTING_MODES) {
					dropdown.addOption(option.value, option.display);
				}
				dropdown
					.setValue(this.plugin.settings.sortingMode)
					.onChange(async value => {
						this.plugin.settings.sortingMode = value as RpnSectionSortComparer;
						await this.plugin.saveSettings();
						showHideSortRegexpSetting(value as RpnSectionSortComparer);
					});
				return dropdown;
			});

		const sortingRegexSetting = new Setting(containerEl)
			.setName('Custom sorting regex')
			.setDesc(createFragment(frag => {
				frag.createEl('p', { text: 'Provide a JavaScript regular expression used to determine sort order.' });
				frag.createEl('p', { text: 'Use capturing groups to extract parts of the header for comparison.' });
				const list = frag.createEl('ul');
				list.createEl('li', { text: 'Example: ^## (.*)$ — captures level 2 headers' });
				list.createEl('li', { text: 'Example: ^### (\\w+) — captures only word characters in level 3 headers' });
				frag.createEl('p', { text: 'If this is left empty, the default sorting mode will be used.' });
			}))
			.addText((text) =>
				text.setValue(this.plugin.settings.customSortingRegex)
					.onChange((value) => {
						this.plugin.settings.customSortingRegex = value.trim();
					})
			);

		const showHideSortingMode = (show: boolean) => {
			sortingModeSetting.settingEl.style.display = show ? '' : 'none';
			sortingRegexSetting.settingEl.style.display = show && this.plugin.settings.sortingMode === 'custom' ? '' : 'none';
		};

		const showHideSortRegexpSetting = (mode: RpnSectionSortComparer) => {
			sortingRegexSetting.settingEl.style.display = mode === 'custom' ? '' : 'none';
		};

		new Setting(containerEl).setName('Note types').setHeading();

		this.plugin.settings.noteTypes.forEach((type: NoteType, index: number) => {
			const typeSetting = new Setting(containerEl).setName(`${type.name}`).setDesc(`Path: ${type.path}`);

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

		this.plugin.settings.userTokens.forEach((token: UserDefinedToken, index: number) => {
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
		const existing = index != null ? noteTypes[index] : { id: nanoid(), name: '', path: '' };

		const modal = new NoteTypeEditModal(this.plugin, existing, async (updated) => {
			if (index != null) {
				noteTypes[index] = updated;
			} else {
				const noteTypeExists = this.plugin.settings.noteTypes.find((t: NoteType) => t.name === updated.name);
				if (noteTypeExists) {
					new Notice(`A note type named "${updated.name}" already exists.`);
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
