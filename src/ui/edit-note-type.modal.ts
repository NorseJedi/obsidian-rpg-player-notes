import { Modal, Notice, Setting } from 'obsidian';
import { getAllTokens } from '../lib/helpers';
import RpgPlayerNotesPlugin from '../main';
import { NoteType } from '../types/rpg-player-notes';

export class EditNoteTypeModal extends Modal {
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

		const pathDescription = this.buildPathDescriptionFragment();

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

	buildPathDescriptionFragment(): DocumentFragment {
		const tokens = getAllTokens(this.plugin.settings);

		// biome-ignore lint/correctness/noUndeclaredVariables: Just biome being difficult...
		return createFragment((frag) => {
			frag.createEl('p', { text: 'Folder where new notes of this type will be saved.' });
			frag.createEl('p', {
				text: 'If the path starts with a forward slash (/), it will be interpreted as an absolute path starting from the vault root. If not, it will be relative to the top folder of the currently active note.'
			});
			frag.createEl('p', { text: 'Some tokens are available for auto substitution:' });

			const table = frag.createEl('table', {
				cls: 'rpg-note-token-table'
			});
			const thead = table.createEl('thead');
			const headerRow = thead.createEl('tr');
			headerRow.createEl('th', { text: 'Token' });
			headerRow.createEl('th', { text: 'Replaced by' });

			const tbody = table.createEl('tbody');

			for (const [i, token] of tokens.entries()) {
				const row = tbody.createEl('tr', {
					cls: i % 2 === 0 ? 'rpg-row-even' : 'rpg-row-odd'
				});
				row.createEl('td', { text: token.token });
				row.createEl('td', { text: token.description });
			}
		});
	}
}
