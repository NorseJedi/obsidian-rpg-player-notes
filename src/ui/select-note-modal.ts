import { FuzzyMatch, FuzzySuggestModal, TFile } from 'obsidian';
import RpgPlayerNotesPlugin from '../main';

export class SelectNoteModal extends FuzzySuggestModal<TFile> {
	onChoose: (result: TFile | null) => void;

	constructor(plugin: RpgPlayerNotesPlugin, onChoose: (result: TFile | null) => void) {
		super(plugin.app);
		this.onChoose = onChoose;
		this.setPlaceholder('Select a note to link to...');
	}

	getItems(): TFile[] {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(item: TFile): string {
		return item.basename;
	}

	renderSuggestion(item: FuzzyMatch<TFile>, el: HTMLElement) {
		const file = item.item;
		const container = el.createDiv({ cls: 'linktarget-item' });

		// Title
		container.createDiv({
			text: file.basename,
			cls: 'linktarget-title'
		});

		// Path (smaller, gray text)
		container.createDiv({
			text: file.path.replace(file.name, ''),
			cls: 'linktarget-sub'
		});
	}

	onChooseItem(item: TFile): void {
		this.onChoose(item);
	}
}
