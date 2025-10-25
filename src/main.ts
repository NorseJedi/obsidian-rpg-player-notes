import { Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin } from 'obsidian';
import { CampaignIndex } from './commands/campaign-index';
import { CompendiumNote } from './commands/compendium-note';
import { LinkSelection } from './commands/link-selection';
import { SectionSorter } from './commands/section-sorter';
import { SessionNavLinks } from './commands/session-nav-links';
import { DEFAULT_SETTINGS } from './constants/rpn-settings';
import { registerDevTools } from './devel/devtools';
import { RpnSettings } from './types/rpg-player-notes';
import { SelectNoteTypeModal } from './ui/select-note-type.modal';
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
			id: 'rpgplayernotes-update-index',
			name: 'Update Campaign Index',
			editorCheckCallback: (checking: boolean, _: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				if (ctx.file !== null) {
					if (!checking) {
						const campaignIndex = new CampaignIndex(this);
						campaignIndex.create(ctx.file);
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'rpgplayernotes-update-session-nav-file',
			name: 'Update Session Note Navigation (current file)',
			editorCallback: async (_: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				const navlinks = new SessionNavLinks(this);
				await navlinks.create(ctx.file);
			}
		});

		this.addCommand({
			id: 'rpgplayernotes-update-session-nav-folder',
			name: 'Update Session Notes Navigation (current folder)',
			editorCallback: async () => {
				const navlinks = new SessionNavLinks(this);
				await navlinks.createAll(this.app.workspace.getActiveFile()?.parent?.path);
			}
		});

		this.addCommand({
			id: 'rpgplayernotes-link-selection',
			name: 'Link Selected Text',
			editorCheckCallback: (checking: boolean, editor: Editor) => {
				const selectedText = editor.getSelection().trim();
				if (selectedText !== '') {
					if (!checking) {
						new LinkSelection(this, editor).link();
					}
					return true;
				}
				return false;
			}
		});

		this.addCommand({
			id: 'rpgplayernotes-sort-section',
			name: 'Sort Section',
			editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				const sorter = new SectionSorter(this);
				await sorter.sortSections(ctx.file!, { lineNumber: editor.getCursor().line });
			}
		});

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
					new SelectNoteTypeModal(this, Object.values(this.settings.noteTypes), async (type) => {
						await this.saveSettings();
						await new CompendiumNote(this, editor, ctx, title, type, replaceSelection).create();
					}).open();
				}
			}
		});

		this.addSettingTab(new RpgPlayerNotesSettingsTab(this.app, this));
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
