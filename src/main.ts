import { App, DropdownComponent, Editor, FuzzySuggestModal, MarkdownFileInfo, MarkdownView, Modal, Notice, normalizePath, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import { ensureFolderExists } from '@/helpers';
import { TextPromptModal } from '@/prompts';
import { DEFAULT_SETTINGS, RpgPlayerNotesSettings, RpgPlayerNotesSettingsTab } from '@/settings';
import { registerDevTools } from './devtools';

export default class RpgPlayerNotesPlugin extends Plugin {
	settings!: RpgPlayerNotesSettings;

	async onload() {
		await this.loadSettings();

		/* biome-ignore lint/correctness/noUndeclaredVariables: defined by Vite */
		if (DEV) {
			registerDevTools(this);
		}

		this.addCommand({
			id: 'rpgplayernotes-create-new-note',
			name: 'Create New RPG Player Note',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
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
					new NoteTypeSelectModal(this.app, async (type) => {
						await this.createCompendiumNote(editor, view, title, type, replaceSelection);
					}).open();
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new RpgPlayerNotesSettingsTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
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

	createCompendiumNote = async (editor: Editor, view: MarkdownView, title: string, type: NoteType, replaceSelection: boolean) => {
		const currentFile = view.file;
		if (!currentFile) return;

		const vault = this.app.vault;

		// Find the top-level folder under vault root for the current note
		const parts = currentFile.path.split('/');
		if (parts.length < 2) {
			new Notice('Note is in root; cannot determine base folder.');
			return;
		}
		const topFolder = parts[0];

		// Construct the new note path relative to the top folder
		const relativeFolder = this.settings.paths[type];
		const newFolderPath = normalizePath(`${topFolder}/${relativeFolder}`);
		const newNotePath = normalizePath(`${newFolderPath}/${title}.md`);

		// Ensure the folder exists
		await ensureFolderExists(this.app.vault, newFolderPath);

		// Create the new note
		if (!(await vault.adapter.exists(newNotePath))) {
			await vault.create(newNotePath, '');
		}

		if (replaceSelection) {
			// Replace selection with link
			editor.replaceSelection(`[[${title}]]`);
		} else {
			const cursor = editor.getCursor();
			editor.replaceRange(`[[${title}]]`, cursor);
		}

		new Notice(`Created ${type} note: ${title}`);

		const newFile = vault.getAbstractFileByPath(newNotePath);
		if (newFile instanceof TFile) {
			const newLeaf = this.app.workspace.getLeaf(true);
			await newLeaf.openFile(newFile);
			this.app.workspace.setActiveLeaf(newLeaf, { focus: true });
		}
	};
}

type NoteType = keyof RpgPlayerNotesSettings['paths'];

class NoteTypeSelectModal extends FuzzySuggestModal<NoteType> {
	constructor(
		app: App,
		private onSelect: (type: NoteType) => void
	) {
		super(app);
	}

	getItems(): NoteType[] {
		return ['person', 'location', 'creature', 'event'];
	}

	getItemText(item: NoteType): string {
		return item;
	}

	onChooseItem(item: NoteType): void {
		this.onSelect(item);
	}
}
