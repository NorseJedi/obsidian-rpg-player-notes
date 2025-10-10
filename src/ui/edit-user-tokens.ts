import { Modal, Notice, Setting } from 'obsidian';
import { UserDefinedToken } from '../constants/tokens';
import RpgPlayerNotesPlugin from '../main';

export class UserTokenModal extends Modal {
	private onSave: (type: UserDefinedToken) => void;

	constructor(
		plugin: RpgPlayerNotesPlugin,
		private token: UserDefinedToken,
		onSave: (type: UserDefinedToken) => void
	) {
		super(plugin.app);
		this.onSave = onSave;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.empty();

		new Setting(contentEl).setName(this.token.token ? 'Edit user-defined token' : 'New user-defined token').setHeading();

		new Setting(contentEl)
			.setName('Token')
			.setDesc('The token word that will be replaced, like "RANDOM" (which will become the token {RANDOM})')
			.addText((text) => text.setValue(this.token.token).onChange((value) => (this.token.token = value.trim())));

		new Setting(contentEl)
			.setName('Description')
			.setDesc('A short description of what will replace the token.')
			.addText((text) => text.setValue(this.token.description).onChange((value) => (this.token.description = value.trim())));

		new Setting(contentEl)
			.setName('Replacement')
			.setClass('align-items-flex-start')
			.setDesc('A JavaScript function that returns a string which will replace the token. Example: "return btoa(Math.random().toString()).slice(2, 14);" for 12 random characters.')
			.addTextArea((text) => {
				text.setValue(this.token.js)
					.setPlaceholder('')
					.onChange((value) => (this.token.js = value.trim()))
					.then((textarea) => {
						textarea.inputEl.rows = 6;
					});
				text.setPlaceholder('JavaScript code that returns a string');
			});

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setIcon('checkmark')
					.setTooltip('Save')
					//					.setButtonText('Save')
					.setCta()
					.onClick(() => {
						if (!this.token.token || !this.token.description || !this.token.js) {
							new Notice('All fields are required');
							return;
						}
						this.onSave(this.token);
						this.close();
					})
			)
			.addButton((btn) =>
				btn
					.setIcon('ban')
					.setTooltip('Cancel')
					.onClick(() => this.close())
			);
		//		this.plugin.settings.userTokens.forEach((token, index) => {
		//			new Setting(contentEl)
		//				.setName(token.token)
		//				.setDesc(token.description)
		//				.addText((text) =>
		//					text.setValue(token.js).onChange(async (val) => {
		//						this.plugin.settings.userTokens[index].js = val;
		//						await this.plugin.saveSettings();
		//					})
		//				)
		//
		//				.addExtraButton((btn) =>
		//					btn.setIcon('trash').onClick(async () => {
		//						this.plugin.settings.userTokens.splice(index, 1);
		//						await this.plugin.saveSettings();
		//						this.onOpen(); // refresh modal
		//					})
		//				);
		//
		//			new Setting(contentEl)
		//				.setName(token.token)
		//				.setDesc(token.description)
		//				.addTextArea((text) => {
		//					text.setValue(token.js);
		//					text.setPlaceholder('Enter JS code that returns a string');
		//					text.onChange((val) => {
		//						this.plugin.settings.userTokens[index].js = val;
		//						this.plugin.saveSettings();
		//					});
		//				});
		//		});
		//
		//		new Setting(contentEl).setName('Add new token').addButton((btn) =>
		//			btn.setButtonText('Add').onClick(async () => {
		//				this.plugin.settings.userTokens.push({
		//					token: '{NEW_TOKEN}',
		//					description: 'Description here',
		//					js: ''
		//				});
		//				await this.plugin.saveSettings();
		//				this.onOpen(); // refresh
		//			})
		//		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
