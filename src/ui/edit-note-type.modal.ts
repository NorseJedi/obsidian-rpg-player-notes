import { Modal, Notice, Setting } from 'obsidian';
import { NoteType } from '../constants/note-type';
import RpgPlayerNotesPlugin from '../main';
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

		const pathDescr = buildPathDescriptionFragment(this.plugin);

		new Setting(contentEl).setName(this.temp.id ? 'Edit note type' : 'New note type').setHeading();

		new Setting(contentEl)
			.setName('ID')
			.setDesc('Used internally - must be unique.')
			.addText((text) => text.setValue(this.temp.id).onChange((value) => (this.temp.id = value.trim())));

		new Setting(contentEl)
			.setName('Label')
			.setDesc('Name shown in the note type selector.')
			.addText((text) => text.setValue(this.temp.label).onChange((value) => (this.temp.label = value.trim())));

		new Setting(contentEl)
			.setName('Path')
			.setDesc(pathDescr)
			.addText((text) => text.setValue(this.temp.path).onChange((value) => (this.temp.path = value.trim())));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setIcon('checkmark')
					.setTooltip('Save')
					//					.setButtonText('Save')
					.setCta()
					.onClick(() => {
						if (!this.temp.id || !this.temp.label || !this.temp.path) {
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
