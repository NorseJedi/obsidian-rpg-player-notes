import { App, Modal, Notice, Setting } from 'obsidian';
import { REPLACEMENT_TOKENS } from '@/constants/tokens';
import { NoteType } from '@/settings';

export class NoteTypeEditModal extends Modal {
	private temp: NoteType;
	private onSave: (type: NoteType) => void;

	constructor(app: App, type: NoteType, onSave: (type: NoteType) => void) {
		super(app);
		this.temp = { ...type };
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: this.temp.id ? 'Edit Note Type' : 'Add Note Type' });

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

// biome-ignore lint/correctness/noUndeclaredVariables: Just biome being difficult...
const pathDescr = createFragment((frag: DocumentFragment) => {
	frag.createEl('p', { text: 'Folder where new notes of this type will be saved.' });
	frag.createEl('p', {
		text: 'If the path starts with a forward slash (/), it will be interpreted as an absolute path starting from the vault root. If not, it will be relative to the top folder of the currently active note.'
	});
	frag.createEl('p', { text: 'Some tokens are available for auto substitution:' });

	const table = frag.createEl('table');
	const thead = table.createEl('thead');
	const headerRow = thead.createEl('tr');
	headerRow.createEl('th', { text: 'Token' });
	headerRow.createEl('th', { text: 'Replaced by' });

	const tbody = table.createEl('tbody');
	for (const t of REPLACEMENT_TOKENS) {
		const row = tbody.createEl('tr');
		row.createEl('td', { text: t.token });
		row.createEl('td', { text: t.description });
	}
});
