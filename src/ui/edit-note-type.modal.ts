import { Modal, Notice, Setting } from 'obsidian';
import RpgPlayerNotesPlugin from '../main';
import { NoteType } from '../types/rpg-player-notes';
import { buildPathDescriptionFragment } from './ui-helpers';

export class NoteTypeEditModal extends Modal {
	private temp: NoteType;
	private onSave: (type: NoteType) => void;

	constructor(
		private plugin: RpgPlayerNotesPlugin,
		type: NoteType,
		onSave: (type: NoteType) => void
	) {
		super(plugin.app);
		this.temp = { ...type };
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		const pathDescription = buildPathDescriptionFragment(this.plugin);

		new Setting(contentEl).setName(this.temp.name ? 'Edit note type' : 'New note type').setHeading();

		new Setting(contentEl)
			.setName('Name')
			.setDesc('Name of the type. Must be unique.')
			.addText((text) => text.setValue(this.temp.name).onChange((value) => (this.temp.name = value.trim())));

		new Setting(contentEl)
			.setName('Path')
			.setDesc(pathDescription)
			.addText((text) => text.setValue(this.temp.path).onChange((value) => (this.temp.path = value.trim())));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setIcon('checkmark')
					.setTooltip('Save')
					//					.setButtonText('Save')
					.setCta()
					.onClick(() => {
						if (!this.temp.name || !this.temp.path) {
							new Notice('All fields are required');
							return;
						}
						this.onSave(this.temp);
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setIcon('ban')
					.setTooltip('Cancel')
					.onClick(() => this.close())
			);
	}

	onClose() {
		this.contentEl.empty();
	}
}
