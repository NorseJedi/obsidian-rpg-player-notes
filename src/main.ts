import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants/rpn-settings';
import { createCompendiumNote } from './create-note';
import { registerDevTools } from './devel/devtools';
import { RpnSettings } from './types/rpg-player-notes';
import { NoteTypeSelectModal } from './ui/note-type-select.modal';
import { RpgPlayerNotesSettingsTab } from './ui/settings';
import { TextPromptModal } from './ui/text-prompt.modal';

export default class RpgPlayerNotesPlugin extends Plugin {
	settings!: RpnSettings;

	async onload() {
		await this.loadSettings();

		/* biome-ignore lint/correctness/noUndeclaredVariables: defined by Vite */
		if (DEV) {
			registerDevTools(this);
		}

		this.addCommand({
			id: 'rpgplayernotes-create-new-note',
			name: 'Create New Note',
			editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				let title: string | null = editor.getSelection().trim();
				let replaceSelection = true;

				if (!title) {
					title = await TextPromptModal.prompt(this.app, {
						title: 'New note title',
						description: 'This will be the title of your new note. You can also select a text before entering this command to make the selected text the title instead.',
						placeholder: 'Enter title'
					});
					if (!title) {
						new Notice('Cancelled');
						return;
					}
					replaceSelection = false;
				}

				if (title) {
					new NoteTypeSelectModal(this.app, this.settings.noteTypes, async (type) => {
						await createCompendiumNote(this, editor, ctx, title, type, replaceSelection);
					}).open();
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RpgPlayerNotesSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin),
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// Called when the plugin is disabled.
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
